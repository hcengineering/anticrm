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

import automation, { TriggerType } from '@anticrm/automation'
import type { Tx } from '@anticrm/core'
import { extractTx, TriggerControl } from '@anticrm/server-core'

/**
 * @public
 */
export async function OnTransaction (tx: Tx, { findAll, hierarchy, txFactory }: TriggerControl): Promise<Tx[]> {
  const actualTx = extractTx(tx)
  const automations = await findAll(automation.class.Automation, { targetClass: (actualTx as any).objectClass, 'trigger.type': TriggerType.Trigger })
  
  return []
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  trigger: {
    OnTransaction
  }
})
