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

import {
  Class,
  Doc,
  DocumentQuery,
  Domain,
  DOMAIN_BLOB,
  DOMAIN_FULLTEXT_BLOB,
  DOMAIN_MODEL,
  DOMAIN_TRANSIENT,
  DOMAIN_TX,
  FindOptions,
  FindResult,
  Hierarchy,
  ModelDb,
  Ref,
  StorageIterator,
  toFindResult,
  Tx,
  TxResult
} from '@anticrm/core'
import { createElasticAdapter, createElasticBackupDataAdapter } from '@anticrm/elastic'
import { ModifiedMiddleware, PrivateMiddleware } from '@anticrm/middleware'
import { createMongoAdapter, createMongoTxAdapter } from '@anticrm/mongo'
import { addLocation } from '@anticrm/platform'
import { serverAttachmentId } from '@anticrm/server-attachment'
import { serverAutomationId } from '@anticrm/server-automation'
import { serverBoardId } from '@anticrm/server-board'
import { serverCalendarId } from '@anticrm/server-calendar'
import { serverChunterId } from '@anticrm/server-chunter'
import { serverContactId } from '@anticrm/server-contact'
import {
  createInMemoryAdapter,
  createPipeline,
  DbAdapter,
  DbConfiguration,
  MiddlewareCreator,
  Pipeline
} from '@anticrm/server-core'
import { serverGmailId } from '@anticrm/server-gmail'
import { serverInventoryId } from '@anticrm/server-inventory'
import { serverLeadId } from '@anticrm/server-lead'
import { serverNotificationId } from '@anticrm/server-notification'
import { serverRecruitId } from '@anticrm/server-recruit'
import { serverSettingId } from '@anticrm/server-setting'
import { serverTagsId } from '@anticrm/server-tags'
import { serverTaskId } from '@anticrm/server-task'
import { serverTrackerId } from '@anticrm/server-tracker'
import { serverTelegramId } from '@anticrm/server-telegram'
import { serverHrId } from '@anticrm/server-hr'
import { Token } from '@anticrm/server-token'
import { BroadcastCall, ClientSession, start as startJsonRpc } from '@anticrm/server-ws'
import { Client as MinioClient } from 'minio'
import { BackupClientSession } from './backup'
import { metricsContext } from './metrics'
import { createMinioDataAdapter } from './minio'

class NullDbAdapter implements DbAdapter {
  async init (model: Tx[]): Promise<void> {}
  async findAll<T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T> | undefined
  ): Promise<FindResult<T>> {
    return toFindResult([])
  }

  async tx (tx: Tx): Promise<TxResult> {
    return {}
  }

  async close (): Promise<void> {}

  find (domain: Domain): StorageIterator {
    return {
      next: async () => undefined,
      close: async () => {}
    }
  }

  async load (domain: Domain, docs: Ref<Doc>[]): Promise<Doc[]> {
    return []
  }

  async upload (domain: Domain, docs: Doc[]): Promise<void> {}

  async clean (domain: Domain, docs: Ref<Doc>[]): Promise<void> {}
}

async function createNullAdapter (hierarchy: Hierarchy, url: string, db: string, modelDb: ModelDb): Promise<DbAdapter> {
  return new NullDbAdapter()
}

/**
 * @public
 */
export interface MinioConfig {
  endPoint: string
  accessKey: string
  secretKey: string
}

/**
 * @public
 */
export function start (
  dbUrl: string,
  fullTextUrl: string,
  minioConf: MinioConfig,
  port: number,
  host?: string
): () => void {
  addLocation(serverAttachmentId, () => import('@anticrm/server-attachment-resources'))
  addLocation(serverBoardId, () => import('@anticrm/server-board-resources'))
  addLocation(serverContactId, () => import('@anticrm/server-contact-resources'))
  addLocation(serverNotificationId, () => import('@anticrm/server-notification-resources'))
  addLocation(serverSettingId, () => import('@anticrm/server-setting-resources'))
  addLocation(serverChunterId, () => import('@anticrm/server-chunter-resources'))
  addLocation(serverInventoryId, () => import('@anticrm/server-inventory-resources'))
  addLocation(serverLeadId, () => import('@anticrm/server-lead-resources'))
  addLocation(serverRecruitId, () => import('@anticrm/server-recruit-resources'))
  addLocation(serverTaskId, () => import('@anticrm/server-task-resources'))
  addLocation(serverTrackerId, () => import('@anticrm/server-tracker-resources'))
  addLocation(serverTagsId, () => import('@anticrm/server-tags-resources'))
  addLocation(serverCalendarId, () => import('@anticrm/server-calendar-resources'))
  addLocation(serverGmailId, () => import('@anticrm/server-gmail-resources'))
  addLocation(serverTelegramId, () => import('@anticrm/server-telegram-resources'))
  addLocation(serverHrId, () => import('@anticrm/server-hr-resources'))
  addLocation(serverAutomationId, () => import('@anticrm/server-automation-resources'))
  const middlewares: MiddlewareCreator[] = [ModifiedMiddleware.create, PrivateMiddleware.create]

  return startJsonRpc(
    metricsContext,
    (workspace: string) => {
      const conf: DbConfiguration = {
        domains: {
          [DOMAIN_TX]: 'MongoTx',
          [DOMAIN_TRANSIENT]: 'InMemory',
          [DOMAIN_BLOB]: 'MinioData',
          [DOMAIN_FULLTEXT_BLOB]: 'FullTextBlob',
          [DOMAIN_MODEL]: 'Null'
        },
        defaultAdapter: 'Mongo',
        adapters: {
          MongoTx: {
            factory: createMongoTxAdapter,
            url: dbUrl
          },
          Mongo: {
            factory: createMongoAdapter,
            url: dbUrl
          },
          Null: {
            factory: createNullAdapter,
            url: ''
          },
          InMemory: {
            factory: createInMemoryAdapter,
            url: ''
          },
          MinioData: {
            factory: createMinioDataAdapter,
            url: ''
          },
          FullTextBlob: {
            factory: createElasticBackupDataAdapter,
            url: fullTextUrl
          }
        },
        fulltextAdapter: {
          factory: createElasticAdapter,
          url: fullTextUrl
        },
        storageFactory: () =>
          new MinioClient({
            ...minioConf,
            port: 9000,
            useSSL: false
          }),
        workspace
      }
      return createPipeline(conf, middlewares)
    },
    (token: Token, pipeline: Pipeline, broadcast: BroadcastCall) => {
      if (token.extra?.mode === 'backup') {
        return new BackupClientSession(broadcast, token, pipeline)
      }
      return new ClientSession(broadcast, token, pipeline)
    },
    port,
    host
  )
}
