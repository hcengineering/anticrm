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

import { createClient, Client } from '@anticrm/core'
import { getMetadata, getResource } from '@anticrm/platform'
import { migrateOperations } from '@anticrm/model-all'
import { connect } from './connection'
import clientPlugin from '@anticrm/client'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => {
  let client: Client
  return {
    function: {
      GetClient: async (): Promise<Client> => {
        if (client === undefined) {
          client = await createClient(connect)
          for (const op of migrateOperations) {
            await op.upgrade(client)
          }
        }
        // Check if we had dev hook for client.
        const hook = getMetadata(clientPlugin.metadata.ClientHook)
        if (hook !== undefined) {
          const hookProc = await getResource(hook)
          client = await hookProc(client)
        }
        return client
      }
    }
  }
}
