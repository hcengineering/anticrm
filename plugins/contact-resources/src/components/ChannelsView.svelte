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
  import type { AttachedData, Doc, Ref, Timestamp } from '@anticrm/core'
  import type { Asset, IntlString } from '@anticrm/platform'
  import type { AnyComponent } from '@anticrm/ui'
  import { Button } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import { getChannelProviders } from '../utils'
  import ChannelsPopup from './ChannelsPopup.svelte'
  import { NotificationClientImpl } from '@anticrm/notification-resources'

  export let value: AttachedData<Channel>[] | Channel | null
  export let size: 'small' | 'medium' | 'large' | 'x-large' = 'large'
  export let length: 'short' | 'full' = 'full'
  export let reverse: boolean = false
  export let integrations: Set<Ref<Doc>> = new Set<Ref<Doc>>()
  const notificationClient = NotificationClientImpl.getClient()
  const lastViews = notificationClient.getLastViews()

  interface Item {
    label: IntlString
    icon: Asset
    value: string
    presenter?: AnyComponent
    integration: boolean
    notification: boolean
  }

  const dispatch = createEventDispatcher()

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
    if (value === null) {
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
  }

  $: if (value) update(value, $lastViews)

  let displayItems: Item[] = []
  let divHTML: HTMLElement
</script>

<div
  bind:this={divHTML}
  class="channels {length}"
  class:one={displayItems?.length === 1}
  class:reverse
  class:small-gap={size === 'small'}
  class:normal-gap={size !== 'small'}
>
  {#each displayItems as item}
    <div class="channel-item">
      <Button
        icon={item.icon}
        kind={'link-bordered'}
        {size}
        highlight={item.integration || item.notification}
        showTooltip={{ component: ChannelsPopup, props: { value: item }, label: undefined, anchor: divHTML }}
        on:click={() => {
          dispatch('click', item)
        }}
      />
    </div>
  {/each}
</div>

<style lang="scss">
  .channels {
    display: grid;
    width: min-content;

    &.one {
      display: block;
    }
    &.short {
      grid-template-columns: repeat(4, min-content);
      grid-auto-rows: auto;
    }
    &.full {
      grid-auto-flow: column;
    }
    &.reverse {
      grid-auto-flow: dense;
    }
    &.small-gap {
      gap: 0.25rem;
    }
    &.normal-gap {
      gap: 0.5rem;
    }
  }
</style>
