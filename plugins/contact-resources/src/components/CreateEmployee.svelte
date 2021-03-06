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
  import { Channel, combineName, Employee, findPerson, Person } from '@anticrm/contact'
  import core, { AccountRole, AttachedData, Data, generateId, Ref } from '@anticrm/core'
  import { getResource } from '@anticrm/platform'
  import { Card, EditableAvatar, getClient } from '@anticrm/presentation'
  import { EditBox, IconInfo, Label, createFocusManager, FocusHandler } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import { ChannelsDropdown } from '..'
  import contact from '../plugin'
  import PersonPresenter from './PersonPresenter.svelte'

  let firstName = ''
  let lastName = ''
  let email = ''

  const id: Ref<Employee> = generateId()

  export function canClose (): boolean {
    return firstName === '' && lastName === '' && email === ''
  }

  const object: Employee = {} as Employee

  const dispatch = createEventDispatcher()
  const client = getClient()

  let avatar: File | undefined

  function onAvatarDone (e: any) {
    const { file } = e.detail

    avatar = file
  }

  function removeAvatar (): void {
    avatar = undefined
  }

  async function createPerson () {
    const name = combineName(firstName, lastName)
    const person: Data<Employee> = {
      name,
      city: object.city,
      active: true
    }

    if (avatar !== undefined) {
      const uploadFile = await getResource(attachment.helper.UploadFile)
      person.avatar = await uploadFile(avatar)
    }

    await client.createDoc(contact.class.Employee, contact.space.Contacts, person, id)

    await client.createDoc(contact.class.EmployeeAccount, core.space.Model, {
      email: email.trim(),
      name,
      employee: id,
      role: AccountRole.User
    })

    for (const channel of channels) {
      await client.addCollection(contact.class.Channel, contact.space.Contacts, id, contact.class.Person, 'channels', {
        value: channel.value,
        provider: channel.provider
      })
    }
    dispatch('close')
  }

  let channels: AttachedData<Channel>[] = []

  let matches: Person[] = []
  $: findPerson(client, { ...object, name: combineName(firstName, lastName) }, channels).then((p) => {
    matches = p
  })

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

<Card
  label={contact.string.CreateEmployee}
  okAction={createPerson}
  canSave={firstName.trim().length > 0 && lastName.trim().length > 0 && matches.length === 0 && email.trim().length > 0}
  on:close={() => {
    dispatch('close')
  }}
>
  <svelte:fragment slot="error">
    {#if matches.length > 0}
      <div class="flex-row-center error-color">
        <IconInfo size={'small'} />
        <span class="text-sm overflow-label ml-2">
          <Label label={contact.string.PersonAlreadyExists} />
        </span>
        <div class="ml-4"><PersonPresenter value={matches[0]} /></div>
      </div>
    {/if}
  </svelte:fragment>
  <div class="flex-row-center">
    <div class="flex-grow flex-col">
      <EditBox
        placeholder={contact.string.PersonFirstNamePlaceholder}
        bind:value={firstName}
        kind={'large-style'}
        maxWidth={'32rem'}
        focus
        focusIndex={1}
      />
      <EditBox
        placeholder={contact.string.PersonLastNamePlaceholder}
        bind:value={lastName}
        kind={'large-style'}
        maxWidth={'32rem'}
        focusIndex={2}
      />
      <div class="mt-1">
        <EditBox
          placeholder={contact.string.Email}
          bind:value={email}
          kind={'small-style'}
          maxWidth={'32rem'}
          focusIndex={3}
        />
      </div>
    </div>
    <div class="ml-4">
      <EditableAvatar avatar={object.avatar} size={'large'} on:done={onAvatarDone} on:remove={removeAvatar} />
    </div>
  </div>
  <svelte:fragment slot="pool">
    <ChannelsDropdown bind:value={channels} focusIndex={10} kind={'no-border'} editable />
  </svelte:fragment>
</Card>
