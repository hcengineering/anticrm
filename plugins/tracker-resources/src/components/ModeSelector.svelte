<script lang="ts">
  import { IntlString } from '@anticrm/platform'
  import { Button } from '@anticrm/ui'

  export let mode: string
  export let config: [string, IntlString][]
  export let onChange: (_mode: string) => void

  function getButtonShape (i: number) {
    if (config.length === 1) return 'round'
    switch (i) {
      case 0:
        return 'rectangle-right'
      case config.length - 1:
        return 'rectangle-left'
      default:
        return 'rectangle'
    }
  }
</script>

<div class="itemsContainer">
  <div class="flex-center">
    {#each config as [_mode, label], i}
      <div class="buttonWrapper">
        <Button
          {label}
          size="small"
          on:click={() => onChange(_mode)}
          selected={_mode === mode}
          shape={getButtonShape(i)}
        />
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .itemsContainer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 1.35rem 0.65rem 2.25rem;
    border-top: 1px solid var(--theme-button-border-hovered);
  }
  .buttonWrapper {
    margin-right: 1px;

    &:last-child {
      margin-right: 0;
    }
  }
</style>
