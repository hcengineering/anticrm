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
  import { Employee, EmployeeAccount } from '@anticrm/contact'
  import { Class, Doc, getCurrentAccount, Ref } from '@anticrm/core'
  import { Card, getClient, UserBoxList } from '@anticrm/presentation'
  import ui, { EditBox, DateRangePresenter } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import calendar from '../plugin'

  export let attachedTo: Ref<Doc>
  export let attachedToClass: Ref<Class<Doc>>
  export let title: string = ''

  let value: number | null | undefined = null
  const currentUser = getCurrentAccount() as EmployeeAccount
  let participants: Ref<Employee>[] = [currentUser.employee]
  const space = calendar.space.PersonalEvents

  const dispatch = createEventDispatcher()
  const client = getClient()

  export function canClose (): boolean {
    return title !== undefined && title.trim().length === 0 && participants.length === 0
  }

  async function saveReminder () {
    let date: number | undefined
    if (value != null) date = value
    // if (value.date !== undefined) {
    //   date = new Date(value.date).getTime()
    // } else if (value.shift !== undefined) {
    //   date = new Date().getTime() + value.shift
    // }
    if (date === undefined) return
    const _id = await client.createDoc(calendar.class.Event, space, {
      attachedTo,
      attachedToClass,
      collection: 'reminders',
      date,
      description: '',
      participants,
      title
    })

    await client.createMixin(_id, calendar.class.Event, space, calendar.mixin.Reminder, {
      shift: 0,
      state: 'active'
    })
  }
</script>

<Card
  label={calendar.string.CreateReminder}
  okAction={saveReminder}
  canSave={title !== undefined && title.trim().length > 0 && participants.length > 0 && value !== undefined}
  on:close={() => {
    dispatch('close')
  }}
>
  <EditBox bind:value={title} placeholder={calendar.string.Title} maxWidth={'37.5rem'} kind={'large-style'} focus />
  <svelte:fragment slot="pool">
    <!-- <TimeShiftPicker title={calendar.string.Date} bind:value direction="after" /> -->
    <DateRangePresenter bind:value withTime={true} editable={true} labelNull={ui.string.SelectDate} />
    <UserBoxList bind:items={participants} label={calendar.string.Participants} />
  </svelte:fragment>
</Card>
