<script lang="ts">
  import { Ref, Space } from '@anticrm/core'
  import Label from '@anticrm/ui/src/components/Label.svelte'
  import board from '../plugin'
  import { createQuery } from '@anticrm/presentation'
  import { MenuPage } from '@anticrm/board'
  import { Button, Component, IconBack, IconClose } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  export let currentSpace: Ref<Space> | undefined

  const dispatch = createEventDispatcher()
  let currentPageId = board.menuPageId.Main
  let trace: string[] = []
  let page: MenuPage
  const query = createQuery()
  $: query.query(board.class.MenuPage, { pageId: currentPageId }, (result) => {
    ;[page] = result
  })
  function setKey (e: CustomEvent) {
    trace = [currentPageId, ...trace]
    currentPageId = e.detail
  }
  function onBack () {
    ;[currentPageId = board.menuPageId.Main, ...trace] = trace
  }
</script>

{#if page}
  <div class="ac-header flex-between w-full divide">
    {#if trace.length}
      <Button icon={IconBack} kind="transparent" size="x-large" on:click={onBack} />
    {:else}
      <div class="ml-12" />
    {/if}
    <div class="flex-center fs-title">
      <Label label={page.label} />
    </div>
    <Button
      icon={IconClose}
      kind="transparent"
      size="x-large"
      on:click={() => {
        dispatch('close')
      }}
    />
  </div>
  {#if currentSpace}
    <div class="vScroll mb-4">
      <Component is={page.component} props={{ space: currentSpace }} on:change={setKey} />
    </div>
  {/if}
{/if}
