//
// Copyright © 2022 Hardcore Engineering Inc.
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
  Class,
  Doc,
  DocumentQuery,
  Domain,
  FindOptions,
  FindResult,
  FullTextData,
  Hierarchy,
  Ref,
  Space,
  StorageIterator,
  Tx,
  TxResult
} from '@anticrm/core'
import { PlatformError, unknownStatus } from '@anticrm/platform'
import { DbAdapter, IndexedDoc } from '@anticrm/server-core'
import { ApiResponse, Client } from '@elastic/elasticsearch'
import { createHash } from 'node:crypto'

class ElasticDataAdapter implements DbAdapter {
  constructor (readonly db: string, readonly client: Client) {}

  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ): Promise<FindResult<T>> {
    return Object.assign([], { total: 0 })
  }

  async tx (tx: Tx): Promise<TxResult> {
    return {}
  }

  async init (model: Tx[]): Promise<void> {}

  async close (): Promise<void> {
    await this.client.close()
  }

  find (domain: Domain): StorageIterator {
    let listRecieved = false
    let pos = 0
    let buffer: { _id: string, data: IndexedDoc }[] = []
    let resp: ApiResponse
    let finished = false
    return {
      next: async () => {
        if (!listRecieved) {
          const q = {
            index: this.db,
            type: '_doc',
            scroll: '1s',
            // search_type: 'scan', //if I use search_type then it requires size otherwise it shows 0 result
            size: 500,
            body: {
              query: {
                match_all: {}
              }
            }
          }
          resp = await this.client.search(q)
          if (resp.statusCode !== 200) {
            console.error('failed elastic query', q, resp)
            throw new PlatformError(unknownStatus(`failed to elastic query ${JSON.stringify(resp)}`))
          }
          buffer = resp.body.hits.hits.map((hit: any) => ({ _id: hit._id, data: hit._source }))
          if (buffer.length === 0) {
            finished = true
          }
          listRecieved = true
        }
        if (pos === buffer.length && !finished) {
          const params = {
            scrollId: resp.body._scroll_id as string,
            scroll: '1s'
          }
          resp = await this.client.scroll(params)
          if (resp.statusCode !== 200) {
            console.error('failed elastic query scroll', params, resp)
            throw new PlatformError(unknownStatus(`failed to elastic query ${JSON.stringify(resp)}`))
          }
          buffer = resp.body.hits.hits.map((hit: any) => ({ _id: hit._id, data: hit._source }))
          if (buffer.length === 0) {
            finished = true
          }
          pos = 0
        }
        if (pos < buffer.length) {
          const item = buffer[pos]
          const hash = createHash('sha256')
          const json = JSON.stringify(item.data)
          hash.update(json)
          const digest = hash.digest('base64')
          const result = {
            id: item._id,
            hash: digest,
            size: json.length
          }
          pos++
          return result
        }
      },
      close: async () => {}
    }
  }

  async load (domain: Domain, docs: Ref<Doc>[]): Promise<Doc[]> {
    const result: Doc[] = []

    const resp = await this.client.search({
      index: this.db,
      type: '_doc',
      body: {
        query: {
          terms: {
            _id: docs,
            boost: 1.0
          }
        },
        size: docs.length
      }
    })
    const buffer = resp.body.hits.hits.map((hit: any) => ({ _id: hit._id, data: hit._source }))

    for (const item of buffer) {
      const dta: FullTextData = {
        _id: item._id as Ref<FullTextData>,
        _class: core.class.FulltextData,
        space: 'fulltext-blob' as Ref<Space>,
        modifiedOn: item.data.modifiedOn,
        modifiedBy: item.data.modifiedBy,
        data: item.data
      }
      result.push(dta)
    }
    return result
  }

  async upload (domain: Domain, docs: Doc[]): Promise<void> {
    while (docs.length > 0) {
      const part = docs.splice(0, 10000)
      await this.client.deleteByQuery(
        {
          type: '_doc',
          index: this.db,
          body: {
            query: {
              terms: {
                _id: Array.from(part.map((it) => it._id)),
                boost: 1.0
              }
            },
            size: part.length
          }
        },
        undefined
      )

      const operations = part.flatMap((doc) => [
        { index: { _index: this.db, _id: doc._id } },
        (doc as FullTextData).data
      ])

      await this.client.bulk({ refresh: true, body: operations })
    }
  }

  async clean (domain: Domain, docs: Ref<Doc>[]): Promise<void> {
    while (docs.length > 0) {
      const part = docs.splice(0, 10000)
      await this.client.deleteByQuery(
        {
          type: '_doc',
          index: this.db,
          body: {
            query: {
              terms: {
                _id: part,
                boost: 1.0
              }
            },
            size: part.length
          }
        },
        undefined
      )
    }
  }
}

/**
 * @public
 */
export async function createElasticBackupDataAdapter (
  hierarchy: Hierarchy,
  url: string,
  db: string
): Promise<DbAdapter> {
  const client = new Client({
    node: url
  })
  return new ElasticDataAdapter(db, client)
}
