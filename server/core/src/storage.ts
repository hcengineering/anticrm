//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import core, {
  AttachedDoc,
  Class,
  ClassifierKind,
  Collection,
  Doc,
  DocumentQuery,
  Domain,
  DOMAIN_MODEL,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy,
  MeasureContext, Mixin, ModelDb,
  Ref,
  ServerStorage, Tx,
  TxBulkWrite,
  TxCollectionCUD,
  TxCreateDoc,
  TxCUD,
  TxFactory,
  TxMixin,
  TxProcessor,
  TxRemoveDoc,
  TxResult,
  TxUpdateDoc
} from '@anticrm/core'
import { getResource } from '@anticrm/platform'
import type { Client as MinioClient } from 'minio'
import { FullTextIndex } from './fulltext'
import serverCore from './plugin'
import { Triggers } from './triggers'
import type { FullTextAdapter, FullTextAdapterFactory, ObjectDDParticipant } from './types'

/**
 * @public
 */
export interface DbAdapter {
  /**
   * Method called after hierarchy is ready to use.
   */
  init: (model: Tx[]) => Promise<void>
  close: () => Promise<void>
  findAll: <T extends Doc>(user: string, _class: Ref<Class<T>>, query: DocumentQuery<T>, options?: FindOptions<T>) => Promise<FindResult<T>>
  tx: (tx: Tx, user: string) => Promise<TxResult>
  isPrivate: () => boolean
}

/**
 * @public
 */
export interface TxAdapter extends DbAdapter {
  getModel: () => Promise<Tx[]>
}

/**
 * @public
 */
export type DbAdapterFactory = (hierarchy: Hierarchy, url: string, db: string, modelDb: ModelDb) => Promise<DbAdapter>

/**
 * @public
 */
export interface DbAdapterConfiguration {
  factory: DbAdapterFactory
  url: string
}

/**
 * @public
 */
export interface DbConfiguration {
  adapters: Record<string, DbAdapterConfiguration>
  domains: Record<string, string>
  defaultAdapter: string
  workspace: string
  fulltextAdapter: {
    factory: FullTextAdapterFactory
    url: string
  }
  storageFactory?: () => MinioClient
}

class TServerStorage implements ServerStorage {
  private readonly fulltext: FullTextIndex

  constructor (
    private readonly domains: Record<string, string>,
    private readonly defaultAdapter: string,
    private readonly adapters: Map<string, DbAdapter>,
    private readonly hierarchy: Hierarchy,
    private readonly triggers: Triggers,
    private readonly fulltextAdapter: FullTextAdapter,
    private readonly storageAdapter: MinioClient | undefined,
    private readonly modelDb: ModelDb,
    private readonly workspace: string,
    options?: ServerStorageOptions
  ) {
    this.fulltext = new FullTextIndex(hierarchy, fulltextAdapter, this, options?.skipUpdateAttached ?? false)
  }

  async close (): Promise<void> {
    for (const o of this.adapters.values()) {
      await o.close()
    }
    await this.fulltextAdapter.close()
  }

  private getAdapter (domain: Domain): DbAdapter {
    const name = this.domains[domain] ?? this.defaultAdapter
    const adapter = this.adapters.get(name)
    if (adapter === undefined) {
      throw new Error('adapter not provided: ' + name)
    }
    return adapter
  }

  private async routeTx (ctx: MeasureContext, userEmail: string, tx: Tx): Promise<[TxResult, boolean]> {
    if (this.hierarchy.isDerived(tx._class, core.class.TxCUD)) {
      const txCUD = tx as TxCUD<Doc>
      const domain = this.hierarchy.getDomain(txCUD.objectClass)
      const adapter = await this.getAdapter(domain)
      const priv = adapter.isPrivate()
      const res = await adapter.tx(txCUD, userEmail)
      return [res, priv]
    } else {
      if (this.hierarchy.isDerived(tx._class, core.class.TxBulkWrite)) {
        const bulkWrite = tx as TxBulkWrite
        for (const tx of bulkWrite.txes) {
          await this.tx(ctx, userEmail, tx)
        }
      } else {
        throw new Error('not implemented (routeTx)')
      }
      return [{}, false]
    }
  }

  async processCollection (ctx: MeasureContext, userEmail: string, tx: Tx): Promise<Tx[]> {
    if (tx._class === core.class.TxCollectionCUD) {
      const colTx = tx as TxCollectionCUD<Doc, AttachedDoc>
      const _id = colTx.objectId
      const _class = colTx.objectClass
      let attachedTo: Doc | undefined

      // Skip model operations
      if (this.hierarchy.getDomain(_class) === DOMAIN_MODEL) {
        // We could not update increments for model classes
        return []
      }

      const isCreateTx = colTx.tx._class === core.class.TxCreateDoc
      if (isCreateTx || colTx.tx._class === core.class.TxRemoveDoc) {
        attachedTo = (await this.findAll(ctx, userEmail, _class, { _id }, { limit: 1 }))[0]
        if (attachedTo !== undefined) {
          const txFactory = new TxFactory(tx.modifiedBy)
          const baseClass = this.hierarchy.getBaseClass(_class)
          if (baseClass !== _class) {
            // Mixin opeeration is required.
            const tx = txFactory.createTxMixin(_id, attachedTo._class, attachedTo.space, _class, {
              $inc: { [colTx.collection]: isCreateTx ? 1 : -1 }
            })
            tx.modifiedOn = colTx.modifiedOn

            return [tx]
          } else {
            const tx = txFactory.createTxUpdateDoc(_class, attachedTo.space, _id, {
              $inc: { [colTx.collection]: isCreateTx ? 1 : -1 }
            })
            tx.modifiedOn = colTx.modifiedOn

            return [tx]
          }
        }
      }
    }
    return []
  }

  async findAll<T extends Doc>(
    ctx: MeasureContext,
    userEmail: string,
    clazz: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await ctx.with('find-all', {}, (ctx) => {
      const domain = this.hierarchy.getDomain(clazz)
      if (query.$search !== undefined) {
        return ctx.with('full-text-find-all', {}, (ctx) => this.fulltext.findAll(ctx, userEmail, clazz, query, options))
      }
      return ctx.with('db-find-all', { _class: clazz, domain }, () =>
        this.getAdapter(domain).findAll(userEmail, clazz, query, options)
      )
    })
  }

  getParentClass (_class: Ref<Class<Doc>>): Ref<Class<Doc>> {
    const baseDomain = this.hierarchy.getDomain(_class)
    const ancestors = this.hierarchy.getAncestors(_class)
    let result: Ref<Class<Doc>> = _class
    for (const ancestor of ancestors) {
      try {
        const domain = this.hierarchy.getClass(ancestor).domain
        if (domain === baseDomain) {
          result = ancestor
        }
      } catch {}
    }
    return result
  }

  getMixins (_class: Ref<Class<Doc>>, object: Doc): Array<Ref<Mixin<Doc>>> {
    const parentClass = this.getParentClass(_class)
    const descendants = this.hierarchy.getDescendants(parentClass)
    return descendants.filter(
      (m) => this.hierarchy.getClass(m).kind === ClassifierKind.MIXIN && this.hierarchy.hasMixin(object, m)
    )
  }

  async buildRemovedDoc (ctx: MeasureContext, userEmail: string, tx: TxRemoveDoc<Doc>): Promise<Doc | undefined> {
    const txes = await this.findAll(ctx, userEmail, core.class.TxCUD, { objectId: tx.objectId }, { sort: { modifiedOn: 1 } })
    let doc: Doc
    let createTx = txes.find((tx) => tx._class === core.class.TxCreateDoc)
    if (createTx === undefined) {
      const collectionTxes = txes.filter((tx) => tx._class === core.class.TxCollectionCUD) as TxCollectionCUD<Doc, AttachedDoc>[]
      createTx = collectionTxes.find((p) => p.tx._class === core.class.TxCreateDoc)
    }
    if (createTx === undefined) return
    doc = TxProcessor.createDoc2Doc(createTx as TxCreateDoc<Doc>)
    for (const tx of txes) {
      if (tx._class === core.class.TxUpdateDoc) {
        doc = TxProcessor.updateDoc2Doc(doc, tx as TxUpdateDoc<Doc>)
      } else if (tx._class === core.class.TxMixin) {
        const mixinTx = tx as TxMixin<Doc, Doc>
        doc = TxProcessor.updateMixin4Doc(doc, mixinTx.mixin, mixinTx.attributes)
      }
    }

    return doc
  }

  extractTx (tx: Tx): Tx {
    if (tx._class === core.class.TxCollectionCUD) {
      const ctx = (tx as TxCollectionCUD<Doc, AttachedDoc>)
      return ctx.tx
    }

    return tx
  }

  async processRemove (ctx: MeasureContext, userEmail: string, tx: Tx): Promise<Tx[]> {
    const actualTx = this.extractTx(tx)
    if (!this.hierarchy.isDerived(actualTx._class, core.class.TxRemoveDoc)) return []
    const rtx = actualTx as TxRemoveDoc<Doc>
    const result: Tx[] = []
    const object = await this.buildRemovedDoc(ctx, userEmail, rtx)
    if (object === undefined) return []
    result.push(...await this.deleteClassCollections(ctx, userEmail, object._class, rtx.objectId))
    const mixins = this.getMixins(object._class, object)
    for (const mixin of mixins) {
      result.push(...await this.deleteClassCollections(ctx, userEmail, mixin, rtx.objectId))
    }
    result.push(...await this.deleteRelatedDocuments(ctx, userEmail, object))
    return result
  }

  async deleteClassCollections (ctx: MeasureContext, userEmail: string, _class: Ref<Class<Doc>>, objectId: Ref<Doc>): Promise<Tx[]> {
    const attributes = this.hierarchy.getAllAttributes(_class)
    const result: Tx[] = []
    for (const attribute of attributes) {
      if (this.hierarchy.isDerived(attribute[1].type._class, core.class.Collection)) {
        const collection = attribute[1].type as Collection<AttachedDoc>
        const allAttached = await this.findAll(ctx, userEmail, collection.of, { attachedTo: objectId })
        for (const attached of allAttached) {
          result.push(...await this.deleteObject(ctx, userEmail, attached))
        }
      }
    }
    return result
  }

  async deleteObject (ctx: MeasureContext, userEmail: string, object: Doc): Promise<Tx[]> {
    const result: Tx[] = []
    const factory = new TxFactory(core.account.System)
    if (this.hierarchy.isDerived(object._class, core.class.AttachedDoc)) {
      const adoc = object as AttachedDoc
      const nestedTx = factory.createTxRemoveDoc(object._class, object.space, adoc._id) as TxRemoveDoc<AttachedDoc>
      const tx = factory.createTxCollectionCUD(
        adoc.attachedToClass,
        adoc.attachedTo,
        object.space,
        adoc.collection,
        nestedTx
      )
      result.push(tx)
    } else {
      result.push(factory.createTxRemoveDoc(object._class, object.space, object._id))
    }
    result.push(...await this.deleteClassCollections(ctx, userEmail, object._class, object._id))
    const mixins = this.getMixins(object._class, object)
    for (const mixin of mixins) {
      result.push(...await this.deleteClassCollections(ctx, userEmail, mixin, object._id))
    }
    result.push(...await this.deleteRelatedDocuments(ctx, userEmail, object))
    return result
  }

  async deleteRelatedDocuments (ctx: MeasureContext, userEmail: string, object: Doc): Promise<Tx[]> {
    const result: Tx[] = []
    const objectClass = this.hierarchy.getClass(object._class)
    if (this.hierarchy.hasMixin(objectClass, serverCore.mixin.ObjectDDParticipant)) {
      const removeParticipand: ObjectDDParticipant = this.hierarchy.as(objectClass, serverCore.mixin.ObjectDDParticipant)
      const collector = await getResource(removeParticipand.collectDocs)
      const docs = await collector(object, this.hierarchy, async (_class, query, options) => {
        return await this.findAll(ctx, userEmail, _class, query, options)
      })
      for (const d of docs) {
        result.push(...await this.deleteObject(ctx, userEmail, d))
      }
    }
    return result
  }

  async tx (ctx: MeasureContext, userEmail: string, tx: Tx): Promise<[TxResult, Tx[], string | undefined]> {
    // store tx
    const _class = txClass(tx)
    const objClass = txObjectClass(tx)
    return await ctx.with('tx', { _class, objClass }, async (ctx) => {
      if (tx.space !== core.space.DerivedTx) {
        await ctx.with('domain-tx', { _class, objClass }, async () => await this.getAdapter(DOMAIN_TX).tx(tx, userEmail))
      }

      if (tx.objectSpace === core.space.Model) {
        // maintain hiearachy and triggers
        this.hierarchy.tx(tx)
        await this.triggers.tx(tx)
        await this.modelDb.tx(tx)
      }

      const fAll = (mctx: MeasureContext) => <T extends Doc>(
        clazz: Ref<Class<T>>,
        query: DocumentQuery<T>,
        options?: FindOptions<T>
      ): Promise<FindResult<T>> => this.findAll(mctx, userEmail, clazz, query, options)

      const triggerFx = new Effects()
      let derived: Tx[] = []
      // store object
      const [result, priv] = await ctx.with('route-tx', { _class, objClass }, (ctx) => this.routeTx(ctx, userEmail, tx))
      // invoke triggers and store derived objects
      derived = [
        ...(await ctx.with('process-collection', { _class }, () => this.processCollection(ctx, userEmail, tx))),
        ...(await ctx.with('process-remove', { _class }, () => this.processRemove(ctx, userEmail, tx))),
        ...(await ctx.with('process-triggers', {}, (ctx) =>
          this.triggers.apply(tx.modifiedBy, tx, {
            fx: triggerFx.fx,
            fulltextFx: (f) => triggerFx.fx(() => f(this.fulltextAdapter)),
            storageFx: (f) => {
              const adapter = this.storageAdapter
              if (adapter === undefined) {
                return
              }

              triggerFx.fx(() => f(adapter, this.workspace))
            },
            findAll: fAll(ctx),
            modelDb: this.modelDb,
            hierarchy: this.hierarchy
          })
        ))
      ]

      for (const tx of derived) {
        await ctx.with('derived-route-tx', { _class: txClass(tx) }, (ctx) => this.routeTx(ctx, userEmail, tx))
      }

      // index object
      await ctx.with('fulltext', { _class, objClass }, (ctx) => this.fulltext.tx(ctx, userEmail, tx))
      // index derived objects
      for (const tx of derived) {
        await ctx.with('derived-fulltext', { _class: txClass(tx) }, (ctx) => this.fulltext.tx(ctx, userEmail, tx))
      }

      for (const fx of triggerFx.effects) {
        await fx()
      }

      return [result, derived, priv ? userEmail : undefined]
    })
  }
}

type Effect = () => Promise<void>
class Effects {
  private readonly _effects: Effect[] = []

  public fx = (f: Effect): void => {
    this._effects.push(f)
  }

  get effects (): Effect[] {
    return [...this._effects]
  }
}

function txObjectClass (tx: Tx): string {
  return tx._class === core.class.TxCollectionCUD
    ? (tx as TxCollectionCUD<Doc, AttachedDoc>).tx.objectClass
    : (tx as TxCUD<Doc>).objectClass
}

function txClass (tx: Tx): string {
  return tx._class === core.class.TxCollectionCUD ? (tx as TxCollectionCUD<Doc, AttachedDoc>).tx._class : tx._class
}

/**
 * @public
 */
export interface ServerStorageOptions {
  // If defined, will skip update of attached documents on document update.
  skipUpdateAttached?: boolean
}
/**
 * @public
 */
export async function createServerStorage (conf: DbConfiguration, options?: ServerStorageOptions): Promise<ServerStorage> {
  const hierarchy = new Hierarchy()
  const triggers = new Triggers()
  const adapters = new Map<string, DbAdapter>()
  const modelDb = new ModelDb(hierarchy)

  for (const key in conf.adapters) {
    const adapterConf = conf.adapters[key]
    adapters.set(key, await adapterConf.factory(hierarchy, adapterConf.url, conf.workspace, modelDb))
  }

  const txAdapter = adapters.get(conf.domains[DOMAIN_TX]) as TxAdapter
  if (txAdapter === undefined) {
    console.log('no txadapter found')
  }

  const model = await txAdapter.getModel()

  for (const tx of model) {
    try {
      hierarchy.tx(tx)
      await triggers.tx(tx)
    } catch (err: any) {
      console.error('failed to apply model transaction, skipping', JSON.stringify(tx), err)
    }
  }

  for (const tx of model) {
    try {
      await modelDb.tx(tx)
    } catch (err: any) {
      console.error('failed to apply model transaction, skipping', JSON.stringify(tx), err)
    }
  }

  for (const [, adapter] of adapters) {
    await adapter.init(model)
  }

  const fulltextAdapter = await conf.fulltextAdapter.factory(conf.fulltextAdapter.url, conf.workspace)
  const storageAdapter = conf.storageFactory?.()

  return new TServerStorage(conf.domains, conf.defaultAdapter, adapters, hierarchy, triggers, fulltextAdapter, storageAdapter, modelDb, conf.workspace, options)
}
