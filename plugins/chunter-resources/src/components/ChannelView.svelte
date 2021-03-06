<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import attachment, { Attachment } from '@anticrm/attachment'
  import { AttachmentRefInput } from '@anticrm/attachment-resources'
  import { ChunterMessage, Message, ChunterSpace } from '@anticrm/chunter'
  import { generateId, getCurrentAccount, Ref, Space } from '@anticrm/core'
  import notification from '@anticrm/notification'
  import { createQuery, getClient } from '@anticrm/presentation'
  import { getCurrentLocation, navigate } from '@anticrm/ui'
  import { createBacklinks } from '../backlinks'
  import chunter from '../plugin'
  import Channel from './Channel.svelte'
  import PinnedMessages from './PinnedMessages.svelte'

  export let space: Ref<Space>
  let chunterSpace: ChunterSpace
  let isScrollForced = false

  const client = getClient()
  const _class = chunter.class.Message
  let _id = generateId() as Ref<Message>

  async function onMessage (event: CustomEvent) {
    const { message, attachments } = event.detail
    const me = getCurrentAccount()._id
    await client.createDoc<Message>(
      _class,
      space,
      {
        attachedTo: space,
        attachedToClass: chunter.class.ChunterSpace,
        collection: 'messages',
        content: message,
        createOn: Date.now(),
        createBy: me,
        attachments
      },
      _id
    )
    if (
      chunterSpace._class === chunter.class.DirectMessage &&
      !chunterSpace.lastMessage &&
      chunterSpace.members.length !== 1
    ) {
      await Promise.all(
        chunterSpace.members
          .filter((accId) => accId !== me)
          .map((accId) =>
            client.createDoc(notification.class.LastView, space, {
              user: accId,
              lastView: 0,
              attachedTo: space,
              attachedToClass: chunterSpace._class,
              collection: 'lastViews'
            })
          )
      )
    }

    // Create an backlink to document
    await createBacklinks(client, space, chunter.class.ChunterSpace, _id, message)

    _id = generateId()
    isScrollForced = true
  }

  function openThread (_id: Ref<Message>) {
    const loc = getCurrentLocation()
    loc.path[4] = _id
    navigate(loc)
  }

  const pinnedQuery = createQuery()
  let pinnedIds: Ref<ChunterMessage>[] = []
  pinnedQuery.query(
    chunter.class.ChunterSpace,
    { _id: space },
    (res) => {
      pinnedIds = res[0]?.pinned ?? []
      chunterSpace = res[0]
    },
    { limit: 1 }
  )

  const savedMessagesQuery = createQuery()
  let savedMessagesIds: Ref<ChunterMessage>[] = []
  savedMessagesQuery.query(chunter.class.SavedMessages, {}, (res) => {
    savedMessagesIds = res.map((r) => r.attachedTo)
  })

  const savedAttachmentsQuery = createQuery()
  let savedAttachmentsIds: Ref<Attachment>[] = []
  savedAttachmentsQuery.query(attachment.class.SavedAttachments, {}, (res) => {
    savedAttachmentsIds = res.map((r) => r.attachedTo)
  })
</script>

<PinnedMessages {space} {pinnedIds} />
<Channel
  bind:isScrollForced
  {space}
  on:openThread={(e) => {
    openThread(e.detail)
  }}
  {pinnedIds}
  {savedMessagesIds}
  {savedAttachmentsIds}
/>
<div class="reference">
  <AttachmentRefInput {space} {_class} objectId={_id} on:message={onMessage} />
</div>

<style lang="scss">
  .reference {
    margin: 1.25rem 2.5rem;
  }
</style>
