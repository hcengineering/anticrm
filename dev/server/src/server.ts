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

import type { Doc, Ref, TxResult } from '@anticrm/core'
import { DOMAIN_TX, MeasureMetricsContext } from '@anticrm/core'
import { createInMemoryTxAdapter } from '@anticrm/dev-storage'
import {
  createInMemoryAdapter,
  createPipeline,
  DbConfiguration,
  FullTextAdapter,
  IndexedDoc
} from '@anticrm/server-core'
import { ClientSession, start as startJsonRpc } from '@anticrm/server-ws'

class NullFullTextAdapter implements FullTextAdapter {
  async index (doc: IndexedDoc): Promise<TxResult> {
    return {}
  }

  async update (id: Ref<Doc>, update: Record<string, any>): Promise<TxResult> {
    return {}
  }

  async search (query: any): Promise<IndexedDoc[]> {
    return []
  }

  async remove (id: Ref<Doc>): Promise<void> {}

  async close (): Promise<void> {}
}

async function createNullFullTextAdapter (): Promise<FullTextAdapter> {
  return new NullFullTextAdapter()
}

/**
 * @public
 */
export async function start (port: number, host?: string): Promise<void> {
  startJsonRpc(
    new MeasureMetricsContext('server', {}),
    () => {
      const conf: DbConfiguration = {
        domains: {
          [DOMAIN_TX]: 'InMemoryTx'
        },
        defaultAdapter: 'InMemory',
        adapters: {
          InMemoryTx: {
            factory: createInMemoryTxAdapter,
            url: ''
          },
          InMemory: {
            factory: createInMemoryAdapter,
            url: ''
          }
        },
        fulltextAdapter: {
          factory: createNullFullTextAdapter,
          url: ''
        },
        workspace: ''
      }
      return createPipeline(conf, [])
    },
    (token, pipeline, broadcast) => new ClientSession(broadcast, token, pipeline),
    port,
    host
  )
}
