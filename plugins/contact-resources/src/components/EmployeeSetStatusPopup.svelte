<script lang="ts">
  import { Status } from '@anticrm/contact'
  import { Timestamp } from '@anticrm/core'
  import { Card } from '@anticrm/presentation'
  import { EditBox, Grid, Label, ticker } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import contact from '../plugin'
  import EmployeeStatusDueDatePresenter from './EmployeeStatusDueDatePresenter.svelte'

  export let currentStatus: Status | undefined

  let statusName: string = currentStatus?.name ?? ''
  let statusDueDate: Timestamp | undefined = currentStatus?.dueDate
  const dispatch = createEventDispatcher()

  const handleDueDateChanged = async (event: CustomEvent<Timestamp>) => {
    statusDueDate = event.detail
  }

  $: statusChanged = statusName !== currentStatus?.name || statusDueDate !== currentStatus?.dueDate
  $: isOverdue = statusDueDate && statusDueDate < $ticker
  $: canSave = statusName.length > 0 && !isOverdue
</script>

<Card
  label={contact.string.SetStatus}
  okAction={() => {
    if (statusChanged) {
      dispatch('update', {
        name: statusName,
        dueDate: statusDueDate
      })
      dispatch('close')
    } else {
      dispatch('update', undefined)
      dispatch('close')
    }
  }}
  {canSave}
  okLabel={statusChanged ? contact.string.SaveStatus : contact.string.ClearStatus}
  on:close={() => {
    dispatch('close')
  }}
>
  <Grid column={1} rowGap={1}>
    <EditBox bind:value={statusName} maxWidth={'16rem'} />
    <div><Label label={contact.string.StatusDueDate} /></div>

    <EmployeeStatusDueDatePresenter {statusDueDate} on:change={handleDueDateChanged} />
  </Grid>
</Card>
