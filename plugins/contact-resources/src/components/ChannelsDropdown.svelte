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
  import type { Channel, ChannelProvider } from '@anticrm/contact'
  import contact from '@anticrm/contact'
  import type { AttachedData, Doc, Ref, Timestamp } from '@anticrm/core'
  import { NotificationClientImpl } from '@anticrm/notification-resources'
  import type { Asset, IntlString } from '@anticrm/platform'
  import presentation from '@anticrm/presentation'
  import {
    Action,
    AnyComponent,
    Button,
    ButtonKind,
    ButtonSize,
    closeTooltip,
    eventToHTMLElement,
    getFocusManager,
    Menu,
    showPopup
  } from '@anticrm/ui'
  import { createEventDispatcher, tick } from 'svelte'
  import { getChannelProviders } from '../utils'
  import ChannelEditor from './ChannelEditor.svelte'

  export let value: AttachedData<Channel>[] | Channel | null
  export let highlighted: Ref<ChannelProvider>[] = []
  export let editable: boolean | undefined = undefined
  export let kind: ButtonKind = 'no-border'
  export let size: ButtonSize = 'small'
  export let length: 'tiny' | 'short' | 'full' = 'full'
  export let shape: 'circle' | undefined = undefined
  export let integrations: Set<Ref<Doc>> = new Set<Ref<Doc>>()
  export let focusIndex = -1

  const notificationClient = NotificationClientImpl.getClient()
  const lastViews = notificationClient.getLastViews()
  const dispatch = createEventDispatcher()

  interface Item {
    label: IntlString
    icon: Asset
    value: string
    presenter?: AnyComponent
    placeholder: IntlString
    provider: Ref<ChannelProvider>
    integration: boolean
    notification: boolean
  }

  function getProvider (
    item: AttachedData<Channel>,
    map: Map<Ref<ChannelProvider>, ChannelProvider>,
    lastViews: Map<Ref<Doc>, Timestamp>
  ): any | undefined {
    const provider = map.get(item.provider)
    if (provider) {
      const notification = (item as Channel)._id !== undefined ? isNew(item as Channel, lastViews) : false
      return {
        label: provider.label,
        icon: provider.icon as Asset,
        value: item.value,
        presenter: provider.presenter,
        placeholder: provider.placeholder,
        provider: provider._id,
        notification,
        integration: provider.integrationType !== undefined ? integrations.has(provider.integrationType) : false
      }
    } else {
      console.log('provider not found: ', item.provider)
    }
  }

  function isNew (item: Channel, lastViews: Map<Ref<Doc>, Timestamp>): boolean {
    if (item.lastMessage === undefined) return false
    const lastView = (item as Channel)._id !== undefined ? lastViews.get((item as Channel)._id) : undefined
    return lastView ? lastView < item.lastMessage : (item.items ?? 0) > 0
  }

  async function update (value: AttachedData<Channel>[] | Channel | null, lastViews: Map<Ref<Doc>, Timestamp>) {
    if (value == null) {
      displayItems = []
      return
    }
    const result = []
    const map = await getChannelProviders()
    if (Array.isArray(value)) {
      for (const item of value) {
        const provider = getProvider(item, map, lastViews)
        if (provider !== undefined) {
          result.push(provider)
        }
      }
    } else {
      const provider = getProvider(value, map, lastViews)
      if (provider !== undefined) {
        result.push(provider)
      }
    }
    displayItems = result
    updateMenu(displayItems)
  }

  $: if (value) update(value, $lastViews)

  let providers: Map<Ref<ChannelProvider>, ChannelProvider>
  let displayItems: Item[] = []
  let actions: Action[] = []
  let addBtn: HTMLButtonElement
  const btns: HTMLButtonElement[] = []
  let opened: number | undefined = undefined

  function filterUndefined (channels: AttachedData<Channel>[]): AttachedData<Channel>[] {
    return channels.filter((channel) => channel.value !== undefined)
  }
  const focusManager = getFocusManager()

  getChannelProviders().then((pr) => (providers = pr))

  const updateMenu = (_displayItems: Item[]): void => {
    actions = []
    providers.forEach((pr) => {
      if (_displayItems.filter((it) => it.provider === pr._id).length === 0) {
        actions.push({
          icon: pr.icon ?? contact.icon.SocialEdit,
          label: pr.label,
          action: async () => {
            const provider = getProvider({ provider: pr._id, value: '' }, providers, $lastViews)
            if (provider !== undefined) {
              if (_displayItems.filter((it) => it.provider === pr._id).length === 0) {
                displayItems = [..._displayItems, provider]
                if (focusIndex !== -1) {
                  await tick()
                  focusManager?.setFocusPos(focusIndex + displayItems.length)
                  await tick()
                  editChannel(btns[displayItems.length - 1], displayItems.length - 1, provider)
                }
              }
            }
          }
        })
      }
    })
  }
  $: if (providers) updateMenu(displayItems)

  const dropItem = (n: number): Item[] => {
    return displayItems.filter((it, i) => i !== n)
  }
  const saveItems = (): void => {
    value = filterUndefined(displayItems)
    dispatch('change', value)
    updateMenu(displayItems)
  }

  const showMenu = (ev: MouseEvent): void => {
    showPopup(Menu, { actions }, ev.target as HTMLElement, (result) => {
      if (result == null) {
        focusManager?.setFocusPos(focusIndex + 2 + displayItems.length)
      }
    })
  }

  const editChannel = (el: HTMLElement, n: number, item: Item): void => {
    if (opened !== n) {
      opened = n
      showPopup(
        ChannelEditor,
        {
          value: item.value,
          placeholder: item.placeholder,
          editable,
          openable: item.presenter ?? false
        },
        el,
        (result) => {
          if (result != null) {
            if (result === '') {
              displayItems = dropItem(n)
            } else {
              if (result !== 'open') displayItems[n].value = result
            }
            saveItems()
            focusManager?.setFocusPos(focusIndex + 1 + n)
          }
          if (result === undefined && item.value === '') displayItems = dropItem(n)
          opened = undefined
          if (result === 'open') dispatch('open', item)
        },
        (result) => {
          if (result != null) {
            if (result === '') {
              displayItems = dropItem(n)
            } else {
              displayItems[n].value = result
            }
            saveItems()
          }
        }
      )
    }
  }
</script>

<div
  class="{displayItems.length === 0 ? 'clear-mins' : 'buttons-group'} {kind === 'no-border'
    ? 'xsmall-gap'
    : 'xxsmall-gap'}"
  class:short={displayItems.length > 4 && length === 'short'}
  class:tiny={displayItems.length > 2 && length === 'tiny'}
>
  {#each displayItems as item, i}
    <Button
      focusIndex={focusIndex === -1 ? focusIndex : focusIndex + 1 + i}
      id={item.label}
      bind:input={btns[i]}
      icon={item.icon}
      kind={highlighted.includes(item.provider) ? 'dangerous' : kind}
      {size}
      {shape}
      highlight={item.integration || item.notification}
      on:click={(ev) => {
        if (editable) {
          closeTooltip()
          editChannel(eventToHTMLElement(ev), i, item)
        } else {
          dispatch('open', item)
        }
      }}
      showTooltip={{
        component: opened !== i ? ChannelEditor : undefined,
        props: {
          value: item.value,
          placeholder: item.placeholder,
          editable: editable !== undefined ? false : undefined,
          openable: item.presenter ?? false
        },
        onUpdate: (result) => {
          if (result.detail === 'open') {
            closeTooltip()
            dispatch('open', item)
          } else if (result.detail === 'edit') {
            closeTooltip()
            editChannel(btns[i], i, item)
          }
        }
      }}
    />
  {/each}
  {#if actions.length > 0 && editable}
    {#if displayItems.length === 0}
      <Button
        focusIndex={focusIndex === -1 ? focusIndex : focusIndex + 2 + displayItems.length}
        id={presentation.string.AddSocialLinks}
        bind:input={addBtn}
        icon={contact.icon.SocialEdit}
        label={presentation.string.AddSocialLinks}
        {kind}
        {size}
        {shape}
        on:click={showMenu}
      />
    {:else}
      <Button
        focusIndex={focusIndex === -1 ? focusIndex : focusIndex + 2 + displayItems.length}
        id={presentation.string.AddSocialLinks}
        bind:input={addBtn}
        icon={contact.icon.SocialEdit}
        {kind}
        {size}
        {shape}
        showTooltip={{ label: presentation.string.AddSocialLinks }}
        on:click={showMenu}
      />
    {/if}
  {/if}
</div>
