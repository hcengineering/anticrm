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

import { Attachment } from '@anticrm/attachment'
import core, {
  Account,
  AttachedDoc,
  Class,
  Doc, DocumentQuery,
  DOMAIN_TX, FindOptions, FindResult,
  generateId,
  Hierarchy, MeasureMetricsContext, metricsToString, ModelDb,
  newMetrics,
  Ref,
  ServerStorage,
  Tx,
  TxCollectionCUD,
  TxCreateDoc,
  TxMixin,
  TxProcessor,
  TxPutBag,
  TxRemoveDoc,
  TxResult,
  TxUpdateDoc
} from '@anticrm/core'
import { createElasticAdapter } from '@anticrm/elastic'
import { DOMAIN_ATTACHMENT } from '@anticrm/model-attachment'
import { createMongoAdapter, createMongoTxAdapter } from '@anticrm/mongo'
import {
  createServerStorage,
  DbAdapter,
  DbConfiguration,
  FullTextAdapter,
  IndexedDoc,
  TxAdapter
} from '@anticrm/server-core'
import { serverAttachmentId } from '@anticrm/server-attachment'
import { serverContactId } from '@anticrm/server-contact'
import { serverNotificationId } from '@anticrm/server-notification'
import { serverSettingId } from '@anticrm/server-setting'
import { serverChunterId } from '@anticrm/server-chunter'
import { serverInventoryId } from '@anticrm/server-inventory'
import { serverLeadId } from '@anticrm/server-lead'
import { serverRecruitId } from '@anticrm/server-recruit'
import { serverTaskId } from '@anticrm/server-task'
import { serverTagsId } from '@anticrm/server-tags'
import { serverCalendarId } from '@anticrm/server-calendar'
import { serverGmailId } from '@anticrm/server-gmail'
import { serverTelegramId } from '@anticrm/server-telegram'
import { Client as ElasticClient } from '@elastic/elasticsearch'
import { Client } from 'minio'
import { Db, MongoClient } from 'mongodb'
import { listMinioObjects } from './minio'
import { addLocation } from '@anticrm/platform'

export async function rebuildElastic (
  mongoUrl: string,
  dbName: string,
  minio: Client,
  elasticUrl: string
): Promise<void> {
  await dropElastic(elasticUrl, dbName)
  return await restoreElastic(mongoUrl, dbName, minio, elasticUrl)
}

async function dropElastic (elasticUrl: string, dbName: string): Promise<void> {
  console.log('drop existing elastic docment')
  const client = new ElasticClient({
    node: elasticUrl
  })
  await new Promise((resolve, reject) => {
    client.indices.exists(
      {
        index: dbName
      },
      (err: any, result: any) => {
        if (err != null) reject(err)
        if (result.body === true) {
          client.indices.delete(
            {
              index: dbName
            },
            (err: any, result: any) => {
              if (err != null) reject(err)
              resolve(result)
            }
          )
        } else {
          resolve(result)
        }
      }
    )
  })
  await client.close()
}

export class ElasticTool {
  mongoClient: MongoClient
  elastic!: FullTextAdapter & {close: () => Promise<void>}
  storage!: ServerStorage
  db!: Db
  constructor (readonly mongoUrl: string, readonly dbName: string, readonly minio: Client, readonly elasticUrl: string) {
    addLocation(serverAttachmentId, () => import('@anticrm/server-attachment-resources'))
    addLocation(serverContactId, () => import('@anticrm/server-contact-resources'))
    addLocation(serverNotificationId, () => import('@anticrm/server-notification-resources'))
    addLocation(serverChunterId, () => import(/* webpackChunkName: "server-chunter" */ '@anticrm/server-chunter-resources'))
    addLocation(serverInventoryId, () => import(/* webpackChunkName: "server-inventory" */ '@anticrm/server-inventory-resources'))
    addLocation(serverLeadId, () => import(/* webpackChunkName: "server-lead" */ '@anticrm/server-lead-resources'))
    addLocation(serverRecruitId, () => import(/* webpackChunkName: "server-recruit" */ '@anticrm/server-recruit-resources'))
    addLocation(serverSettingId, () => import(/* webpackChunkName: "server-recruit" */ '@anticrm/server-setting-resources'))
    addLocation(serverTaskId, () => import/* webpackChunkName: "server-task" */ ('@anticrm/server-task-resources'))
    addLocation(serverTagsId, () => import/* webpackChunkName: "server-tags" */ ('@anticrm/server-tags-resources'))
    addLocation(serverCalendarId, () => import/* webpackChunkName: "server-calendar" */ ('@anticrm/server-calendar-resources'))
    addLocation(serverGmailId, () => import/* webpackChunkName: "server-gmail" */ ('@anticrm/server-gmail-resources'))
    addLocation(serverTelegramId, () => import/* webpackChunkName: "server-telegram" */ ('@anticrm/server-telegram-resources'))
    this.mongoClient = new MongoClient(mongoUrl)
  }

  async connect (): Promise<() => Promise<void>> {
    await this.mongoClient.connect()

    this.db = this.mongoClient.db(this.dbName)
    this.elastic = await createElasticAdapter(this.elasticUrl, this.dbName)
    this.storage = await createStorage(this.mongoUrl, this.elasticUrl, this.dbName)

    return async () => {
      await this.mongoClient.close()
      await this.elastic.close()
      await this.storage.close()
    }
  }

  async indexAttachment (
    name: string
  ): Promise<void> {
    const doc: Attachment | null = await this.db.collection<Attachment>(DOMAIN_ATTACHMENT).findOne({ file: name })
    if (doc == null) return

    const buffer = await this.readMinioObject(name)
    await this.indexAttachmentDoc(doc, buffer)
  }

  async indexAttachmentDoc (doc: Attachment, buffer: Buffer): Promise<void> {
    const id: Ref<Doc> = (generateId() + '/attachments/') as Ref<Doc>

    const indexedDoc: IndexedDoc = {
      id: id,
      _class: doc._class,
      space: doc.space,
      modifiedOn: doc.modifiedOn,
      modifiedBy: 'core:account:System' as Ref<Account>,
      attachedTo: doc.attachedTo,
      data: buffer.toString('base64')
    }

    await this.elastic.index(indexedDoc)
  }

  private async readMinioObject (name: string): Promise<Buffer> {
    const data = await this.minio.getObject(this.dbName, name)
    const chunks: Buffer[] = []
    await new Promise<void>((resolve) => {
      data.on('readable', () => {
        let chunk
        while ((chunk = data.read()) !== null) {
          const b = chunk as Buffer
          chunks.push(b)
        }
      })

      data.on('end', () => {
        resolve()
      })
    })
    return Buffer.concat(chunks)
  }
}

async function restoreElastic (mongoUrl: string, dbName: string, minio: Client, elasticUrl: string): Promise<void> {
  const tool = new ElasticTool(mongoUrl, dbName, minio, elasticUrl)
  const done = await tool.connect()
  try {
    const data = (await tool.db.collection<Tx>(DOMAIN_TX).find().toArray())
    const m = newMetrics()
    const metricsCtx = new MeasureMetricsContext('elastic', {}, m)
    console.log('replay elastic transactions', data.length)
    let pos = 0
    let p = Date.now()

    const isCreateTx = (tx: Tx): boolean => tx._class === core.class.TxCreateDoc
    const isMixinTx = (tx: Tx): boolean => tx._class === core.class.TxMixin || (tx._class === core.class.TxCollectionCUD && (tx as TxCollectionCUD<Doc, AttachedDoc>).tx._class === core.class.TxMixin)
    const isCollectionCreateTx = (tx: Tx): boolean => tx._class === core.class.TxCollectionCUD && (tx as TxCollectionCUD<Doc, AttachedDoc>).tx._class === core.class.TxCreateDoc

    const tdata = data.filter(tx => isCreateTx(tx) || isMixinTx(tx) || isCollectionCreateTx(tx))
    const removedDocument = new Set<Ref<Doc>>()
    for (const tx of tdata) {
      pos++
      if (pos % 5000 === 0) {
        console.log('replay elastic transactions', pos, tdata.length, Date.now() - p)
        p = Date.now()
      }
      if (isCreateTx(tx)) {
        const createTx = tx as TxCreateDoc<Doc>
        const docSnapshot = (await tool.storage.findAll(metricsCtx, 'system', createTx.objectClass, { _id: createTx.objectId }, { limit: 1 })).shift()
        if (docSnapshot !== undefined) {
          // If there is no doc, then it is removed, not need to do something with elastic.
          const { _class, _id, modifiedBy, modifiedOn, space, ...docData } = docSnapshot
          try {
            const newTx: TxCreateDoc<Doc> = {
              ...createTx,
              attributes: docData,
              modifiedBy,
              modifiedOn,
              objectSpace: space // <- it could be moved, let's take actual one.
            }
            await tool.storage.tx(metricsCtx, 'system', newTx)
          } catch (err: any) {
            console.error('failed to replay tx', tx, err.message)
          }
        } else {
          removedDocument.add(createTx.objectId)
        }
      }

      // We need process mixins.
      if (isMixinTx(tx)) {
        try {
          let deleted = false
          if (tx._class === core.class.TxMixin) {
            deleted = removedDocument.has((tx as TxMixin<Doc, Doc>).objectId)
          }
          if (tx._class === core.class.TxCollectionCUD && (tx as TxCollectionCUD<Doc, AttachedDoc>).tx._class === core.class.TxMixin) {
            deleted = removedDocument.has((tx as TxCollectionCUD<Doc, AttachedDoc>).tx.objectId)
          }
          if (!deleted) {
            await tool.storage.tx(metricsCtx, 'system', tx)
          }
        } catch (err: any) {
          console.error('failed to replay tx', tx, err.message)
        }
      }

      // We need process collection creations.
      if (isCollectionCreateTx(tx)) {
        const collTx = tx as TxCollectionCUD<Doc, AttachedDoc>
        const createTx = collTx.tx as unknown as TxCreateDoc<AttachedDoc>
        const docSnapshot = (await tool.storage.findAll(metricsCtx, 'system', createTx.objectClass, { _id: createTx.objectId }, { limit: 1 })).shift() as AttachedDoc
        if (docSnapshot !== undefined) {
          // If there is no doc, then it is removed, not need to do something with elastic.
          const { _class, _id, modifiedBy, modifiedOn, space, ...data } = docSnapshot
          try {
            const newTx: TxCreateDoc<AttachedDoc> = {
              ...createTx,
              attributes: data,
              modifiedBy,
              modifiedOn,
              objectSpace: space // <- it could be moved, let's take actual one.
            }
            collTx.tx = newTx
            collTx.modifiedBy = modifiedBy
            collTx.modifiedOn = modifiedOn
            collTx.objectSpace = space
            await tool.storage.tx(metricsCtx, 'system', collTx)
          } catch (err: any) {
            console.error('failed to replay tx', tx, err.message)
          }
        }
      }
    }
    let apos = 0
    if (await minio.bucketExists(dbName)) {
      const minioObjects = await listMinioObjects(minio, dbName)
      console.log('reply elastic documents', minioObjects.length)
      for (const d of minioObjects) {
        apos++
        try {
          await tool.indexAttachment(d.name)
        } catch (err: any) {
          console.error(err)
        }
        if (apos % 100 === 0) {
          console.log('replay minio documents', apos, minioObjects.length)
        }
      }
    }
    console.log('replay elastic transactions done')
    console.log(metricsToString(m))
  } finally {
    console.log('Elastic restore done')
    await done()
  }
}

async function createStorage (mongoUrl: string, elasticUrl: string, workspace: string): Promise<ServerStorage> {
  const conf: DbConfiguration = {
    domains: {
      [DOMAIN_TX]: 'MongoTx'
    },
    defaultAdapter: 'Mongo',
    adapters: {
      MongoTx: {
        factory: createMongoReadOnlyTxAdapter,
        url: mongoUrl
      },
      Mongo: {
        factory: createMongoReadOnlyAdapter,
        url: mongoUrl
      }
    },
    fulltextAdapter: {
      factory: createElasticAdapter,
      url: elasticUrl
    },
    workspace
  }
  return await createServerStorage(conf, { skipUpdateAttached: true })
}

async function createMongoReadOnlyAdapter (
  hierarchy: Hierarchy,
  url: string,
  dbName: string,
  modelDb: ModelDb
): Promise<DbAdapter> {
  const adapter = await createMongoAdapter(hierarchy, url, dbName, modelDb)
  return new MongoReadOnlyAdapter(adapter)
}

async function createMongoReadOnlyTxAdapter (
  hierarchy: Hierarchy,
  url: string,
  dbName: string,
  modelDb: ModelDb
): Promise<TxAdapter> {
  const adapter = await createMongoTxAdapter(hierarchy, url, dbName, modelDb)
  return new MongoReadOnlyTxAdapter(adapter)
}

class MongoReadOnlyAdapter extends TxProcessor implements DbAdapter {
  constructor (protected readonly adapter: DbAdapter) {
    super()
  }

  protected txCreateDoc (tx: TxCreateDoc<Doc>): Promise<TxResult> {
    throw new Error('Method not implemented.')
  }

  protected txPutBag (tx: TxPutBag<any>): Promise<TxResult> {
    throw new Error('Method not implemented.')
  }

  protected txUpdateDoc (tx: TxUpdateDoc<Doc>): Promise<TxResult> {
    throw new Error('Method not implemented.')
  }

  protected txRemoveDoc (tx: TxRemoveDoc<Doc>): Promise<TxResult> {
    throw new Error('Method not implemented.')
  }

  protected txMixin (tx: TxMixin<Doc, Doc>): Promise<TxResult> {
    throw new Error('Method not implemented.')
  }

  async init (model: Tx[]): Promise<void> {
    return await this.adapter.init(model)
  }

  async findAll<T extends Doc>(
    user: string,
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return await this.adapter.findAll(user, _class, query, options)
  }

  override tx (tx: Tx): Promise<TxResult> {
    return new Promise((resolve) => resolve({}))
  }

  async close (): Promise<void> {
    await this.adapter.close()
  }
}

class MongoReadOnlyTxAdapter extends MongoReadOnlyAdapter implements TxAdapter {
  constructor (protected readonly adapter: TxAdapter) {
    super(adapter)
  }

  async getModel (): Promise<Tx[]> {
    return await this.adapter.getModel()
  }
}
