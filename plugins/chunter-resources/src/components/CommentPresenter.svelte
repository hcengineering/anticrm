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
  import { AttachmentDocList } from '@anticrm/attachment-resources'
  import type { Comment } from '@anticrm/chunter'
  import { formatName } from '@anticrm/contact'
  import { Avatar, getClient, MessageViewer } from '@anticrm/presentation'
  import { TimeSince, ShowMore } from '@anticrm/ui'
  import { getUser } from '../utils'

  export let value: Comment

  const client = getClient()
</script>

<div class="flex-row-top">
  <div class="avatar">
    <Avatar size={'medium'} />
  </div>
  <div class="flex-grow flex-col">
    <div class="header">
      <div class="fs-title">
        {#await getUser(client, value.modifiedBy) then user}
          {#if user}{formatName(user.name)}{/if}
        {/await}
      </div>
      <div class="content-trans-color ml-4"><TimeSince value={value.modifiedOn} /></div>
    </div>
    <ShowMore limit={126} fixed>
      <MessageViewer message={value.message} />
      <AttachmentDocList {value} />
    </ShowMore>
  </div>
</div>

<style lang="scss">
  .avatar {
    margin-right: 1rem;
    min-width: 2.25rem;
  }
  .header {
    display: inline-flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.25rem;
  }
</style>
