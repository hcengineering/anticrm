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
  import { createEventDispatcher, onMount } from 'svelte'
  import { getCurrentAccount, Ref, Space } from '@anticrm/core'
  import { EditBox, createFocusManager, FocusHandler } from '@anticrm/ui'
  import { getClient, createQuery } from '@anticrm/presentation'
  import setting from '@anticrm/setting'
  import { IntegrationType } from '@anticrm/setting'
  import contact from '../plugin'
  import { Organization } from '@anticrm/contact'
  import Company from './icons/Company.svelte'
  import ChannelsEditor from './ChannelsEditor.svelte'

  export let object: Organization

  const client = getClient()

  const dispatch = createEventDispatcher()

  function nameChange () {
    client.updateDoc(object._class, object.space, object._id, { name: object.name })
  }

  const accountId = getCurrentAccount()._id
  let integrations: Set<Ref<IntegrationType>> = new Set<Ref<IntegrationType>>()
  const settingsQuery = createQuery()
  $: settingsQuery.query(
    setting.class.Integration,
    { space: accountId as string as Ref<Space>, disabled: false },
    (res) => {
      integrations = new Set(res.map((p) => p.type))
    }
  )

  onMount(() => {
    dispatch('open', { ignoreKeys: ['comments', 'name', 'channels'] })
  })

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

{#if object !== undefined}
  <div class="flex-row-center">
    <div class="mr-8 flex-center logo">
      <Company size={'large'} />
    </div>
    <div class="flex-grow flex-col">
      <div class="name">
        <EditBox
          placeholder={contact.string.PersonFirstNamePlaceholder}
          maxWidth="20rem"
          bind:value={object.name}
          on:change={nameChange}
          focus
          focusIndex={1}
        />
      </div>
      <div class="separator" />
      <div class="flex-row-center">
        <ChannelsEditor attachedTo={object._id} attachedClass={object._class} {integrations} focusIndex={10} on:click />
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .logo {
    width: 5rem;
    height: 5rem;
    color: var(--primary-button-color);
    background-color: var(--primary-button-enabled);
    border-radius: 50%;
  }
  .name {
    font-weight: 500;
    font-size: 1.25rem;
    color: var(--theme-caption-color);
  }
  .separator {
    margin: 1rem 0;
    height: 1px;
    background-color: var(--divider-color);
  }
</style>
