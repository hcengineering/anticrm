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
  import { createQuery, EditableAvatar, getClient } from '@anticrm/presentation'
  import { createFocusManager, EditBox, FocusHandler } from '@anticrm/ui'

  import { createEventDispatcher, onMount } from 'svelte'
  import { Department } from '@anticrm/hr'
  import core, { getCurrentAccount, Ref, Space } from '@anticrm/core'
  import hr from '../plugin'
  import { getResource } from '@anticrm/platform'
  import attachment from '@anticrm/attachment'
  import { ChannelsEditor } from '@anticrm/contact-resources'
  import setting, { IntegrationType } from '@anticrm/setting'

  export let object: Department

  const dispatch = createEventDispatcher()
  const client = getClient()

  async function onAvatarDone (e: any) {
    if (object === undefined) return
    const uploadFile = await getResource(attachment.helper.UploadFile)
    const deleteFile = await getResource(attachment.helper.DeleteFile)
    const { file: avatar } = e.detail

    if (object.avatar != null) {
      await deleteFile(object.avatar)
    }
    const uuid = await uploadFile(avatar)
    await client.updateDoc(object._class, object.space, object._id, {
      avatar: uuid
    })
  }

  async function removeAvatar (): Promise<void> {
    if (object === undefined) return
    const deleteFile = await getResource(attachment.helper.DeleteFile)
    if (object.avatar != null) {
      await client.updateDoc(object._class, object.space, object._id, {
        avatar: null
      })
      await deleteFile(object.avatar)
    }
  }

  async function nameChange (): Promise<void> {
    if (object === undefined) return
    await client.update(object, {
      name: object.name
    })
  }

  const manager = createFocusManager()

  let integrations: Set<Ref<IntegrationType>> = new Set<Ref<IntegrationType>>()
  const accountId = getCurrentAccount()._id
  const settingsQuery = createQuery()
  $: settingsQuery.query(
    setting.class.Integration,
    { space: accountId as string as Ref<Space>, disabled: false },
    (res) => {
      integrations = new Set(res.map((p) => p.type))
    }
  )

  onMount(() => {
    dispatch('open', {
      ignoreKeys: ['comments', 'name', 'channels', 'private', 'archived'],
      collectionArrays: ['members']
    })
  })
</script>

<FocusHandler {manager} />

{#if object !== undefined}
  <div class="flex-row-stretch flex-grow">
    <div class="mr-8">
      {#key object}
        <EditableAvatar
          avatar={object.avatar}
          size={'x-large'}
          icon={hr.icon.Department}
          on:done={onAvatarDone}
          on:remove={removeAvatar}
        />
      {/key}
    </div>
    <div class="flex-grow flex-col">
      <div class="name">
        <EditBox
          placeholder={core.string.Name}
          maxWidth="20rem"
          bind:value={object.name}
          on:change={nameChange}
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
