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
  import { SharedMessage } from '@anticrm/gmail'
  import Button from '@anticrm/ui/src/components/Button.svelte'
  import { createEventDispatcher } from 'svelte'
  import { IconArrowLeft, Label, Scroller } from '@anticrm/ui'
  import gmail from '../plugin'
  import FullMessageContent from './FullMessageContent.svelte'
  import { createQuery } from '@anticrm/presentation'
  import attachment, { Attachment } from '@anticrm/attachment'
  import { AttachmentPresenter } from '@anticrm/attachment-resources'

  export let currentMessage: SharedMessage
  export let newMessage: boolean

  let editor: HTMLDivElement
  $: if (editor) editor.innerHTML = currentMessage.content

  const dispatch = createEventDispatcher()

  const query = createQuery()
  let attachments: Attachment[] = []

  $: currentMessage._id &&
    query.query(
      attachment.class.Attachment,
      {
        attachedTo: currentMessage._id
      },
      (res) => (attachments = res)
    )

  $: title = currentMessage.incoming ? currentMessage.sender : currentMessage.receiver
  $: user = currentMessage.incoming ? currentMessage.receiver : currentMessage.sender
</script>

<div class="popupPanel-body__main-header bottom-divider">
  <div class="flex-between">
    <div class="buttons-group">
      <Button
        icon={IconArrowLeft}
        kind={'transparent'}
        on:click={() => {
          dispatch('close')
        }}
      />
      <div class="flex-grow flex-col">
        <span>{currentMessage.subject}</span>
        <span class="content-accent-color">
          <Label label={currentMessage.incoming ? gmail.string.From : gmail.string.To} />
          <b>{title}</b>
        </span>
      </div>
    </div>
    <div class="buttons-group small-gap">
      <Button
        label={gmail.string.Reply}
        size={'small'}
        kind={'primary'}
        on:click={() => {
          newMessage = true
        }}
      />
    </div>
  </div>
</div>
<Scroller>
  <div class="popupPanel-body__main-content py-4">
    <Label label={currentMessage.incoming ? gmail.string.To : gmail.string.From} />
    {user}
    {#if currentMessage.copy?.length}
      <Label label={gmail.string.Copy} />: {currentMessage.copy.join(', ')}
    {/if}
    {#if attachments.length}
      <div class="flex-row-center list mt-2">
        {#each attachments as attachment}
          <div class="item flex">
            <AttachmentPresenter value={attachment} />
          </div>
        {/each}
      </div>
    {/if}
    <div class="flex-col content clear-mins">
      <FullMessageContent content={currentMessage.content} />
    </div>
  </div>
</Scroller>

<style lang="scss">
  .list {
    padding: 0.5rem;
    color: var(--theme-caption-color);
    overflow-x: auto;
    overflow-y: hidden;
    background-color: var(--accent-bg-color);
    border: 1px solid var(--divider-color);
    border-radius: 0.25rem;

    .item + .item {
      padding-left: 1rem;
      border-left: 1px solid var(--divider-color);
    }
  }
  .content {
    margin-top: 1rem;
    background-color: var(--incoming-msg);
    border-radius: 0.25rem;
  }
</style>
