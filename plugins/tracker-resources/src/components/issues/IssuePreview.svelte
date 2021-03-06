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
  import attachment from '@anticrm/attachment'
  import { AttachmentDocList } from '@anticrm/attachment-resources'
  import chunter from '@anticrm/chunter'
  import { CommentPopup } from '@anticrm/chunter-resources'
  import { Ref, SortingOrder } from '@anticrm/core'
  import { createQuery, getClient, MessageViewer } from '@anticrm/presentation'
  import { Issue, IssueStatus, Team } from '@anticrm/tracker'
  import { Label, resizeObserver, Scroller } from '@anticrm/ui'
  import tracker from '../../plugin'
  import AssigneeEditor from './AssigneeEditor.svelte'
  import PriorityEditor from './PriorityEditor.svelte'
  import StatusEditor from './StatusEditor.svelte'
  import IssueStatusActivity from './IssueStatusActivity.svelte'

  export let object: Issue
  let issue: Issue | undefined

  const client = getClient()
  $: space = object.space
  const issueQuery = createQuery()
  const spaceQuery = createQuery()
  const statusesQuery = createQuery()

  $: issueQuery.query(
    object._class,
    { _id: object._id },
    (res) => {
      issue = res[0]
    },
    { limit: 1 }
  )
  let statuses: IssueStatus[] = []

  $: statusesQuery.query(
    tracker.class.IssueStatus,
    { attachedTo: space },
    (res) => {
      statuses = res
    },
    {
      lookup: { category: tracker.class.IssueStatusCategory },
      sort: { rank: SortingOrder.Ascending }
    }
  )
  let currentTeam: Team | undefined

  $: spaceQuery.query(tracker.class.Team, { _id: space }, (res) => ([currentTeam] = res))
  $: issueName = currentTeam && issue && `${currentTeam.identifier}-${issue.number}`

  const limit: number = 350

  let cHeight: number

  let parent: Issue | undefined

  async function getParent (attachedTo: Ref<Issue> | undefined): Promise<void> {
    if (attachedTo === undefined || attachedTo === tracker.ids.NoParent) {
      parent = undefined
    } else {
      parent = await client.findOne(tracker.class.Issue, { _id: attachedTo })
    }
  }

  $: getParent(issue?.attachedTo as Ref<Issue>)
</script>

<div class="flex">
  <Scroller>
    <div class="w-165 scrollerContent">
      {#if parent}
        <div class="mb-4 ml-2">{parent.title}</div>
      {/if}
      {#if issue}
        <div class="fs-title text-xl ml-2">{issueName} {issue.title}</div>
        <div class="flex mt-2">
          <StatusEditor value={issue} {statuses} shouldShowLabel kind={'transparent'} />
          <PriorityEditor value={issue} shouldShowLabel />
          {#if issue.assignee}
            <AssigneeEditor value={issue} width={'min-content'} />
          {/if}
        </div>
        <IssueStatusActivity {issue} />

        <div class="mb-2">
          <Label label={tracker.string.Description} />:
        </div>
        {#if issue.description}
          <div
            class="descr ml-2"
            class:mask={cHeight >= limit}
            use:resizeObserver={(element) => {
              cHeight = element.clientHeight
            }}
          >
            <MessageViewer message={issue.description} />
          </div>
        {:else}
          <div class="ml-2 content-trans-color">
            <Label label={tracker.string.NoDescription} />
          </div>
        {/if}
        {#if issue.attachments}
          <div class="mt-2 mb-2">
            <Label label={attachment.string.Attachments} />:
          </div>
          <div>
            <AttachmentDocList value={issue} />
          </div>
        {/if}
        {#if issue.comments}
          <div class="mt-2 mb-2">
            <Label label={chunter.string.Comments} />:
          </div>
          <div class="ml-2">
            <CommentPopup objectId={issue._id} />
          </div>
        {/if}
      {/if}
    </div>
  </Scroller>
</div>

<style lang="scss">
  .descr {
    overflow: hidden;
    max-height: 25rem;

    &.mask {
      mask: linear-gradient(to top, rgba(0, 0, 0, 0) 0, black 5rem);
    }
  }

  .scrollerContent {
    height: fit-content;
    max-height: 32rem;
  }
</style>
