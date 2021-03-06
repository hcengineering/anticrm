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
  import contact, { Contact } from '@anticrm/contact'
  import { AttachedData, generateId, Ref, SortingOrder, Space } from '@anticrm/core'
  import type { Customer, Lead } from '@anticrm/lead'
  import { OK, Status } from '@anticrm/platform'
  import { Card, getClient, SpaceSelector, UserBox } from '@anticrm/presentation'
  import task, { calcRank } from '@anticrm/task'
  import { createFocusManager, EditBox, FocusHandler, Label, Status as StatusControl } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import lead from '../plugin'

  export let space: Ref<Space>
  export let customer: Ref<Contact> | null = null
  export let preserveCustomer = false

  let _space = space
  const status: Status = OK

  let title: string = ''

  const dispatch = createEventDispatcher()
  const client = getClient()
  const leadId = generateId() as Ref<Lead>

  export function canClose (): boolean {
    return (preserveCustomer || customer === undefined) && title === ''
  }

  $: client.findAll(lead.class.Funnel, {}).then((r) => {
    if (r.find((it) => it._id === _space) === undefined) {
      _space = r.shift()?._id as Ref<Space>
    }
  })

  async function createLead () {
    const state = await client.findOne(task.class.State, { space: _space })
    if (state === undefined) {
      throw new Error('create application: state not found')
    }
    const sequence = await client.findOne(task.class.Sequence, { attachedTo: lead.class.Lead })
    if (sequence === undefined) {
      throw new Error('sequence object not found')
    }

    const lastOne = await client.findOne(
      lead.class.Lead,
      { state: state._id },
      { sort: { rank: SortingOrder.Descending } }
    )
    const incResult = await client.update(sequence, { $inc: { sequence: 1 } }, true)

    const value: AttachedData<Lead> = {
      state: state._id,
      doneState: null,
      number: (incResult as any).object.sequence,
      title: title,
      rank: calcRank(lastOne, undefined),
      assignee: null,
      startDate: null,
      dueDate: null
    }

    const customerInstance = await client.findOne(contact.class.Contact, { _id: customer! })
    if (customerInstance === undefined) {
      throw new Error('contact not found')
    }
    if (!client.getHierarchy().hasMixin(customerInstance, lead.mixin.Customer)) {
      await client.createMixin<Contact, Customer>(
        customerInstance._id,
        customerInstance._class,
        customerInstance.space,
        lead.mixin.Customer,
        { description: '' }
      )
    }

    await client.addCollection(lead.class.Lead, _space, customer!, lead.mixin.Customer, 'leads', value, leadId)
    dispatch('close')
  }

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

<Card
  label={lead.string.CreateLead}
  okAction={createLead}
  canSave={title.length > 0 && customer !== null}
  on:close={() => {
    dispatch('close')
  }}
>
  <svelte:fragment slot="header">
    <SpaceSelector
      _class={lead.class.Funnel}
      label={lead.string.FunnelName}
      bind:space={_space}
      create={{
        component: lead.component.CreateFunnel,
        label: lead.string.CreateFunnel
      }}
    />
  </svelte:fragment>
  <svelte:fragment slot="title">
    <div class="flex-row-center gap-2">
      {#if preserveCustomer}
        <UserBox
          readonly
          _class={contact.class.Contact}
          options={{ sort: { modifiedOn: -1 } }}
          excluded={[]}
          label={lead.string.Leads}
          placeholder={lead.string.Leads}
          bind:value={customer}
          kind={'no-border'}
          size={'small'}
        />
      {/if}
      <Label label={lead.string.CreateLead} />
    </div>
  </svelte:fragment>
  <StatusControl slot="error" {status} />
  <EditBox
    focusIndex={1}
    label={lead.string.LeadName}
    bind:value={title}
    icon={lead.icon.Lead}
    placeholder={lead.string.LeadPlaceholder}
    maxWidth={'16rem'}
    focus
  />
  <svelte:fragment slot="pool">
    {#if !preserveCustomer}
      <UserBox
        focusIndex={2}
        _class={contact.class.Contact}
        label={lead.string.Customer}
        placeholder={lead.string.SelectCustomer}
        bind:value={customer}
        kind={'no-border'}
        size={'small'}
        create={{ component: lead.component.CreateCustomer, label: lead.string.CreateCustomer }}
      />
    {/if}
  </svelte:fragment>
</Card>
