<!--
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
-->
<script lang="ts">
  import { WithLookup } from '@anticrm/core'
  import type { Issue, Team } from '@anticrm/tracker'
  import { Icon } from '@anticrm/ui'
  import tracker from '../../plugin'
  import { getIssueId } from '../../issues'

  export let value: WithLookup<Issue>
  $: title = getIssueId(value.$lookup?.space as Team, value)
</script>

<div class="flex item">
  <Icon icon={tracker.icon.TrackerApplication} size={'medium'} />
  <div class="ml-2">
    {title} - {value.title}
  </div>
</div>

<style lang="scss">
  .item {
    align-items: center;
  }
</style>
