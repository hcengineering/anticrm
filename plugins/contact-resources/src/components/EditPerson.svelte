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
  import { combineName, EmployeeAccount, getFirstName, getLastName, Person } from '@anticrm/contact'
  import { AccountRole, getCurrentAccount, Ref, Space } from '@anticrm/core'
  import { getResource } from '@anticrm/platform'
  import { AttributeEditor, Avatar, createQuery, EditableAvatar, getClient } from '@anticrm/presentation'
  import setting, { IntegrationType } from '@anticrm/setting'
  import { EditBox, createFocusManager, FocusHandler } from '@anticrm/ui'
  import { createEventDispatcher, onMount } from 'svelte'
  import contact from '../plugin'
  import ChannelsEditor from './ChannelsEditor.svelte'

  export let object: Person
  const client = getClient()

  const hierarchy = client.getHierarchy()
  const account = getCurrentAccount() as EmployeeAccount

  $: editable =
    !hierarchy.isDerived(object._class, contact.class.Employee) ||
    account.role === AccountRole.Owner ||
    object._id === account.employee
  let firstName = getFirstName(object.name)
  let lastName = getLastName(object.name)

  $: setName(object)

  function setName (object: Person) {
    firstName = getFirstName(object.name)
    lastName = getLastName(object.name)
  }

  const dispatch = createEventDispatcher()

  function firstNameChange () {
    client.updateDoc(object._class, object.space, object._id, {
      name: combineName(firstName, getLastName(object.name))
    })
  }

  function lastNameChange () {
    client.updateDoc(object._class, object.space, object._id, {
      name: combineName(getFirstName(object.name), lastName)
    })
  }

  let integrations: Set<Ref<IntegrationType>> = new Set<Ref<IntegrationType>>()
  const settingsQuery = createQuery()
  $: settingsQuery.query(
    setting.class.Integration,
    { space: account._id as string as Ref<Space>, disabled: false },
    (res) => {
      integrations = new Set(res.map((p) => p.type))
    }
  )

  const sendOpen = () => dispatch('open', { ignoreKeys: ['comments', 'name', 'channels', 'city'] })
  onMount(sendOpen)

  async function onAvatarDone (e: any) {
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
    const deleteFile = await getResource(attachment.helper.DeleteFile)
    if (object.avatar != null) {
      await client.updateDoc(object._class, object.space, object._id, {
        avatar: null
      })
      await deleteFile(object.avatar)
    }
  }

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

{#if object !== undefined}
  <div class="flex-row-stretch flex-grow">
    <div class="mr-8">
      {#key object}
        {#if editable}
          <EditableAvatar avatar={object.avatar} size={'x-large'} on:done={onAvatarDone} on:remove={removeAvatar} />
        {:else}
          <Avatar avatar={object.avatar} size={'x-large'} />
        {/if}
      {/key}
    </div>
    <div class="flex-grow flex-col">
      <div class="flex-grow flex-col">
        <div class="name">
          {#if editable}
            <EditBox
              placeholder={contact.string.PersonFirstNamePlaceholder}
              maxWidth="20rem"
              bind:value={firstName}
              on:change={firstNameChange}
              focusIndex={1}
            />
          {:else}
            {firstName}
          {/if}
        </div>
        <div class="name">
          {#if editable}
            <EditBox
              placeholder={contact.string.PersonLastNamePlaceholder}
              maxWidth="20rem"
              bind:value={lastName}
              on:change={lastNameChange}
              focusIndex={2}
            />
          {:else}
            {lastName}
          {/if}
        </div>
        <div class="location">
          <AttributeEditor
            maxWidth="20rem"
            _class={contact.class.Person}
            {editable}
            {object}
            key="city"
            focusIndex={3}
          />
        </div>
      </div>

      <div class="separator" />
      <div class="flex-row-center">
        <ChannelsEditor
          attachedTo={object._id}
          attachedClass={object._class}
          {editable}
          bind:integrations
          shape={'circle'}
          focusIndex={10}
        />
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
  .location {
    margin-top: 0.25rem;
    font-size: 0.75rem;
  }

  .separator {
    margin: 1rem 0;
    height: 1px;
    background-color: var(--divider-color);
  }
</style>
