<script lang="ts">
  import type { Card } from '@anticrm/board'
  import { DatePresenter } from '@anticrm/ui'

  export let value: Card
  export let size: 'x-small' | 'small' = 'small'

  const isOverdue = !!value?.dueDate && new Date().getTime() > value.dueDate
</script>

{#if value}
  <div class="flex-presenter flex-gap-1 h-full">
    <div class="flex-center h-full" on:click>
      <div class="flex-row-center background-button-bg-color pr-1 pl-1 border-radius-1 w-full">
        {#if value.startDate}
          <DatePresenter bind:value={value.startDate} {size} kind="transparent" />
        {/if}
        {#if value.startDate && value.dueDate}-{/if}
        {#if value.dueDate}
          <DatePresenter
            bind:value={value.dueDate}
            withTime={true}
            icon={isOverdue ? 'overdue' : undefined}
            {size}
            kind="transparent"
          />
        {/if}
      </div>
    </div>
  </div>
{/if}
