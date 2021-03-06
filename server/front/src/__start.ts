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

import { Client } from 'minio'
import { setMetadata } from '@anticrm/platform'
import serverToken from '@anticrm/server-token'
import { start } from './app'

const SERVER_PORT = parseInt(process.env.SERVER_PORT ?? '8080')

const transactorEndpoint = process.env.TRANSACTOR_URL
if (transactorEndpoint === undefined) {
  console.error('please provide transactor url')
  process.exit(1)
}

const elasticUrl = process.env.ELASTIC_URL
if (elasticUrl === undefined) {
  console.error('please provide elastic url')
  process.exit(1)
}

const minioEndpoint = process.env.MINIO_ENDPOINT
if (minioEndpoint === undefined) {
  console.error('please provide minio endpoint')
  process.exit(1)
}

const minioAccessKey = process.env.MINIO_ACCESS_KEY
if (minioAccessKey === undefined) {
  console.error('please provide minio access key')
  process.exit(1)
}

const minioSecretKey = process.env.MINIO_SECRET_KEY
if (minioSecretKey === undefined) {
  console.error('please provide minio secret key')
  process.exit(1)
}

const minio = new Client({
  endPoint: minioEndpoint,
  port: 9000,
  useSSL: false,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey
})

const accountsUrl = process.env.ACCOUNTS_URL
if (accountsUrl === undefined) {
  console.error('please provide accounts url')
  process.exit(1)
}

const uploadUrl = process.env.UPLOAD_URL
if (uploadUrl === undefined) {
  console.error('please provide upload url')
  process.exit(1)
}

const modelVersion = process.env.MODEL_VERSION
if (modelVersion === undefined) {
  console.error('please provide model version requirement')
  process.exit(1)
}

const serverSecret = process.env.SERVER_SECRET
if (serverSecret === undefined) {
  console.log('Please provide server secret')
  process.exit(1)
}

setMetadata(serverToken.metadata.Secret, serverSecret)

const config = { transactorEndpoint, elasticUrl, minio, accountsUrl, uploadUrl, modelVersion }
console.log('Starting Front service with', config)
const shutdown = start(config, SERVER_PORT)

const close = (): void => {
  console.trace('Exiting from server')
  console.log('Shutdown request accepted')
  shutdown()
  process.exit(0)
}

process.on('SIGINT', close)
process.on('SIGTERM', close)
