<!--
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
-->
<script lang="ts">
  import { AttachedData } from '@anticrm/core'
  import { DatePopup } from '@anticrm/ui'
  import { getClient } from '@anticrm/presentation'
  import { Issue } from '@anticrm/tracker'
  import { createEventDispatcher } from 'svelte'

  export let value: Issue | AttachedData<Issue>
  export let mondayStart = true
  export let withTime = false

  const client = getClient()
  const dispatch = createEventDispatcher()

  async function onUpdate ({ detail }: CustomEvent<Date | null | undefined>) {
    const newDueDate = detail && detail?.getTime()

    if ('_id' in value && newDueDate !== undefined && newDueDate !== value.dueDate) {
      await client.update(value, { dueDate: newDueDate })
    }

    dispatch('update', newDueDate)
  }

  $: currentDate = value.dueDate !== null ? new Date(value.dueDate) : null
</script>

<DatePopup {currentDate} {mondayStart} {withTime} on:close on:update={onUpdate} />
