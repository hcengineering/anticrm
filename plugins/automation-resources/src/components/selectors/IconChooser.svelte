<script lang="ts">
  import { Metadata } from '@anticrm/platform'
  import presentation, { Card } from '@anticrm/presentation'
  import { Button } from '@anticrm/ui'
  import view from '@anticrm/view'
  import { createEventDispatcher } from 'svelte'

  import automation from '../../plugin'

  export let icon: Metadata<string> | undefined = undefined

  const dispatch = createEventDispatcher()
  const icons = [
    view.icon.Archive,
    view.icon.ArrowRight,
    view.icon.Card,
    view.icon.Delete,
    view.icon.Model,
    view.icon.MoreH,
    view.icon.Move,
    view.icon.Open,
    view.icon.Pin,
    view.icon.Setting,
    view.icon.Statuses,
    view.icon.Table,
    view.icon.Views
  ]

  function save () {
    dispatch('close', icon)
  }
</script>

<Card
  label={automation.string.Automation}
  okLabel={presentation.string.Save}
  okAction={save}
  canSave={icon !== undefined}
  on:close={() => {
    dispatch('close')
  }}
>
  <div class="float-left-box">
    {#each icons as obj}
      <div class="float-left p-2">
        <Button
          icon={obj}
          size="medium"
          kind={obj === icon ? 'primary' : 'transparent'}
          on:click={() => {
            icon = obj
          }}
        />
      </div>
    {/each}
  </div>
</Card>
