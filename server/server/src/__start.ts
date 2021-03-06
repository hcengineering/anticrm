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

// Add this to the VERY top of the first file loaded in your app
import { setMetadata } from '@anticrm/platform'
import serverToken from '@anticrm/server-token'
import { start } from '.'

const serverPort = parseInt(process.env.SERVER_PORT ?? '3333')

const url = process.env.MONGO_URL
if (url === undefined) {
  console.error('please provide mongodb url')
  process.exit(1)
}

const elasticUrl = process.env.ELASTIC_URL
if (elasticUrl === undefined) {
  console.error('please provide elastic url')
  process.exit(1)
}

const minioEndpoint = process.env.MINIO_ENDPOINT
if (minioEndpoint === undefined) {
  console.error('MINIO_ENDPOINT is required')
  process.exit(1)
}

const minioAccessKey = process.env.MINIO_ACCESS_KEY
if (minioAccessKey === undefined) {
  console.error('MINIO_ACCESS_KEY is required')
  process.exit(1)
}

const minioSecretKey = process.env.MINIO_SECRET_KEY
if (minioSecretKey === undefined) {
  console.error('MINIO_SECRET_KEY is required')
  process.exit(1)
}

const minioConf = {
  endPoint: minioEndpoint,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey
}

const serverSecret = process.env.SERVER_SECRET
if (serverSecret === undefined) {
  console.log('Please provide server secret')
  process.exit(1)
}

setMetadata(serverToken.metadata.Secret, serverSecret)

// eslint-disable-next-line @typescript-eslint/no-floating-promises
console.log(`starting server on ${serverPort}`)
const shutdown = start(url, elasticUrl, minioConf, serverPort)

const close = (): void => {
  console.trace('Exiting from server')
  console.log('Shutdown request accepted')
  shutdown()
  process.exit(0)
}

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('SIGINT', close)
process.on('SIGTERM', close)
