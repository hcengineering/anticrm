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
  import { WithLookup } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import type { Issue, Team } from '@anticrm/tracker'
  import { showPanel } from '@anticrm/ui'
  import tracker from '../../plugin'

  export let value: WithLookup<Issue>
  // export let inline: boolean = false

  function handleIssueEditorOpened () {
    showPanel(tracker.component.EditIssue, value._id, value._class, 'content')
  }

  const spaceQuery = createQuery()
  let currentTeam: Team | undefined = value?.$lookup?.space

  $: if (value?.$lookup?.space === undefined) {
    spaceQuery.query(tracker.class.Team, { _id: value.space }, (res) => ([currentTeam] = res))
  } else {
    spaceQuery.unsubscribe()
  }

  $: title = currentTeam ? `${currentTeam.identifier}-${value.number}` : `${value.number}`
</script>

{#if value}
  <span class="issuePresenterRoot" title="title" on:click={handleIssueEditorOpened}>
    {title}
  </span>
{/if}

<style lang="scss">
  .issuePresenterRoot {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    flex-shrink: 0;
    max-width: 5rem;
    font-size: 0.8125rem;
    color: var(--content-color);
    cursor: pointer;

    &:hover {
      color: var(--caption-color);
      text-decoration: underline;
    }
    &:active {
      color: var(--accent-color);
    }
  }
</style>
