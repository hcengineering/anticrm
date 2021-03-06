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
  import attachment from '@anticrm/attachment'
  import { AttachmentRefInput } from '@anticrm/attachment-resources'
  import { createEventDispatcher } from 'svelte'
  import contact, { Channel, Contact, EmployeeAccount, formatName } from '@anticrm/contact'
  import { generateId, getCurrentAccount, Ref, SortingOrder, Space, Class } from '@anticrm/core'
  import { NotificationClientImpl } from '@anticrm/notification-resources'
  import { createQuery, getClient } from '@anticrm/presentation'
  import setting, { Integration } from '@anticrm/setting'
  import type { NewTelegramMessage, SharedTelegramMessage, TelegramMessage } from '@anticrm/telegram'
  import { Button, eventToHTMLElement, IconShare, Scroller, showPopup, Panel, Icon, Label } from '@anticrm/ui'
  import telegram from '../plugin'
  import Connect from './Connect.svelte'
  import TelegramIcon from './icons/Telegram.svelte'
  import Messages from './Messages.svelte'
  import Reconnect from './Reconnect.svelte'

  export let _id: Ref<Contact>
  export let _class: Ref<Class<Contact>>

  let object: Contact
  let channel: Channel | undefined = undefined
  let objectId: Ref<NewTelegramMessage> = generateId()

  const dispatch = createEventDispatcher()

  const client = getClient()
  const notificationClient = NotificationClientImpl.getClient()

  client
    .findOne(contact.class.Channel, {
      attachedTo: _id,
      provider: contact.channelProvider.Telegram
    })
    .then((res) => {
      channel = res
    })

  const query = createQuery()
  $: _id &&
    _class &&
    query.query(_class, { _id }, (result) => {
      object = result[0]
    })

  let messages: TelegramMessage[] = []
  let accounts: EmployeeAccount[] = []
  let integration: Integration | undefined
  let selected: Set<Ref<SharedTelegramMessage>> = new Set<Ref<SharedTelegramMessage>>()
  let selectable = false

  const messagesQuery = createQuery()
  const accauntsQuery = createQuery()
  const settingsQuery = createQuery()
  const accountId = getCurrentAccount()._id

  function updateMessagesQuery (channelId: Ref<Channel>): void {
    messagesQuery.query(
      telegram.class.Message,
      { attachedTo: channelId },
      (res) => {
        messages = res.reverse()
        if (channel !== undefined) {
          notificationClient.updateLastView(channel._id, channel._class, undefined, true)
        }
        const accountsIds = new Set(messages.map((p) => p.modifiedBy as Ref<EmployeeAccount>))
        updateAccountsQuery(accountsIds)
      },
      {
        sort: { sendOn: SortingOrder.Descending },
        limit: 500,
        lookup: {
          _id: { attachments: attachment.class.Attachment }
        }
      }
    )
  }

  $: channel && updateMessagesQuery(channel._id)

  function updateAccountsQuery (accountsIds: Set<Ref<EmployeeAccount>>): void {
    accauntsQuery.query(contact.class.EmployeeAccount, { _id: { $in: Array.from(accountsIds) } }, (result) => {
      accounts = result
    })
  }

  settingsQuery.query(
    setting.class.Integration,
    { type: telegram.integrationType.Telegram, space: accountId as string as Ref<Space> },
    (res) => {
      integration = res[0]
    }
  )

  async function onMessage (event: CustomEvent) {
    if (channel === undefined) return
    const { message, attachments } = event.detail
    await client.createDoc(
      telegram.class.NewMessage,
      telegram.space.Telegram,
      {
        content: message,
        status: 'new',
        attachments,
        attachedTo: channel._id,
        attachedToClass: channel._class,
        collection: 'newMessages'
      },
      objectId
    )

    objectId = generateId()
  }

  function getName (message: TelegramMessage, accounts: EmployeeAccount[]): string {
    return message.incoming ? object.name : accounts.find((p) => p._id === message.modifiedBy)?.name ?? ''
  }

  async function share (): Promise<void> {
    const selectedMessages = messages.filter((m) => selected.has(m._id as unknown as Ref<SharedTelegramMessage>))
    await client.addCollection(
      telegram.class.SharedMessages,
      object.space,
      object._id,
      object._class,
      'sharedTelegramMessages',
      {
        messages: convertMessages(selectedMessages, accounts)
      }
    )
    if (channel !== undefined) {
      await notificationClient.updateLastView(channel._id, channel._class, channel.modifiedOn, true)
    }
    clear()
  }

  function clear (): void {
    selectable = false
    selected.clear()
    selected = selected
  }

  function convertMessages (messages: TelegramMessage[], accounts: EmployeeAccount[]): SharedTelegramMessage[] {
    return messages.map((m) => {
      return {
        ...m,
        _id: m._id as unknown as Ref<SharedTelegramMessage>,
        sender: getName(m, accounts)
      }
    })
  }

  async function onConnectClose (res: any): Promise<void> {
    if (res?.value) {
      await client.createDoc(setting.class.Integration, accountId as string as Ref<Space>, {
        type: telegram.integrationType.Telegram,
        value: res.value,
        disabled: false
      })
    }
  }

  async function onReconnect (res: any): Promise<void> {
    if (res?.value && integration !== undefined) {
      await client.update(integration, {
        disabled: false
      })
    }
  }
</script>

{#if object !== undefined}
  <Panel
    isHeader={true}
    isAside={false}
    isFullSize
    on:fullsize
    on:close={() => {
      dispatch('close')
    }}
  >
    <svelte:fragment slot="title">
      <div class="antiTitle icon-wrapper">
        <div class="wrapped-icon"><Icon icon={TelegramIcon} size={'medium'} /></div>
        <div class="title-wrapper">
          <span class="wrapped-title">Telegram</span>
          <span class="wrapped-subtitle">
            <Label label={telegram.string.YouAnd} />
            <b>{formatName(object.name)}</b>
          </span>
        </div>
      </div>
      <!-- You and {formatName(object.name)} -->
    </svelte:fragment>
    <svelte:fragment slot="utils">
      {#if integration === undefined}
        <Button
          label={telegram.string.Connect}
          kind={'primary'}
          on:click={(e) => {
            showPopup(Connect, {}, eventToHTMLElement(e), onConnectClose)
          }}
        />
      {:else if integration.disabled}
        <Button
          label={setting.string.Reconnect}
          kind={'primary'}
          on:click={(e) => {
            showPopup(Reconnect, {}, eventToHTMLElement(e), onReconnect)
          }}
        />
      {:else}
        <Button
          icon={IconShare}
          kind={'transparent'}
          size={'medium'}
          showTooltip={{ label: telegram.string.Share }}
          on:click={async () => {
            selectable = !selectable
          }}
        />
      {/if}
    </svelte:fragment>

    <Scroller bottomStart autoscroll>
      {#if messages && accounts}
        <Messages messages={convertMessages(messages, accounts)} {selectable} bind:selected />
      {/if}
    </Scroller>

    {#if integration !== undefined && !integration.disabled}
      <div class="popupPanel-body__main-header ref-input" class:selectable>
        {#if selectable}
          <div class="flex-between">
            <span>{selected.size} messages selected</span>
            <div class="flex">
              <div>
                <Button label={telegram.string.Cancel} size={'medium'} on:click={clear} />
              </div>
              <div class="ml-3">
                <Button
                  label={telegram.string.PublishSelected}
                  size={'medium'}
                  kind={'primary'}
                  disabled={!selected.size}
                  on:click={share}
                />
              </div>
            </div>
          </div>
        {:else}
          <AttachmentRefInput
            space={telegram.space.Telegram}
            _class={telegram.class.NewMessage}
            {objectId}
            on:message={onMessage}
          />
        {/if}
      </div>
    {/if}
  </Panel>
{/if}

<style lang="scss">
  .ref-input {
    padding: 0.5rem 0 1.5rem;

    &.selectable {
      padding: 1rem 0;
      color: var(--theme-caption-color);
      border-top: 1px solid var(--divider-color);
    }
  }
</style>
