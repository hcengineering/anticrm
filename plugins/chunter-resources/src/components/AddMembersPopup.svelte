<script lang="ts">
  import { Channel } from '@anticrm/chunter'
  import contact, { Employee, EmployeeAccount, formatName } from '@anticrm/contact'
  import core, { Ref } from '@anticrm/core'
  import presentation, { getClient, UsersPopup } from '@anticrm/presentation'
  import { Label, Button, ActionIcon, IconClose } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import chunter from '../plugin'

  export let channel: Channel
  const dispatch = createEventDispatcher()
  const client = getClient()

  let membersToAdd: EmployeeAccount[] = []
  let channelMembers: Ref<Employee>[] = []
  client.findAll(core.class.Account, { _id: { $in: channel.members } }).then((res) => {
    channelMembers = res
      .filter((e) => e._class === contact.class.EmployeeAccount)
      .map((e) => (e as EmployeeAccount).employee)
  })

  async function changeMembersToAdd (employees: Ref<Employee>[]) {
    if (employees) {
      await client.findAll(contact.class.EmployeeAccount, { employee: { $in: employees } }).then((res) => {
        if (res) {
          membersToAdd = res
        }
      })
    }
  }

  $: selectedEmployees = membersToAdd.map((e) => e.employee)

  function removeMember (_id: Ref<EmployeeAccount>) {
    membersToAdd = membersToAdd.filter((m) => m._id !== _id)
  }
</script>

<div class="antiPopup antiPopup-withHeader">
  <div class="ap-header flex-between header">
    <div class="ap-caption">
      <Label label={chunter.string.AddMembersHeader} params={{ channel: channel.name }} />
    </div>
    <div class="tool">
      <ActionIcon
        icon={IconClose}
        size={'small'}
        action={() => {
          dispatch('close')
        }}
      />
    </div>
  </div>
  {#if membersToAdd.length}
    <div class="flex-row-top flex-wrap ml-6 mr-6 mt-4">
      {#each membersToAdd as m}
        <div class=" mr-2 p-1 item">
          {formatName(m.name)}
          <div class="tool">
            <ActionIcon
              icon={IconClose}
              size={'small'}
              action={() => {
                removeMember(m._id)
              }}
            />
          </div>
        </div>
      {/each}
    </div>
  {/if}
  <div class="ml-8 mr-8 mb-6 mt-4">
    <UsersPopup
      selected={undefined}
      _class={contact.class.Employee}
      docQuery={{
        active: true
      }}
      multiSelect={true}
      allowDeselect={true}
      selectedUsers={selectedEmployees}
      ignoreUsers={channelMembers}
      shadows={false}
      on:update={(ev) => changeMembersToAdd(ev.detail)}
    />
  </div>
  <Button
    on:click={() => {
      dispatch(
        'update',
        membersToAdd.map((m) => m._id)
      )
      dispatch('close')
    }}
    label={presentation.string.Add}
  />
</div>

<style lang="scss">
  .header {
    flex-direction: row;
  }

  .item {
    display: flex;
    flex-direction: row;
    width: fit-content;
    background-color: var(--popup-bg-hover);
  }
</style>
