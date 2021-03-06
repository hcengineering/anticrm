<script lang="ts">
  import { Doc } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import type { TagReference } from '@anticrm/tags'
  import tags from '@anticrm/tags'
  import { getEventPopupPositionElement, showPopup, resizeObserver } from '@anticrm/ui'
  import TagReferencePresenter from './TagReferencePresenter.svelte'
  import TagsEditorPopup from './TagsEditorPopup.svelte'
  import { createEventDispatcher, afterUpdate } from 'svelte'

  export let object: Doc
  export let full: boolean
  export let ckeckFilled: boolean = false
  export let kind: 'short' | 'full' = 'short'
  export let isEditable: boolean = false
  export let action: (evt: MouseEvent) => Promise<void> | void = async () => {}

  const dispatch = createEventDispatcher()

  let items: TagReference[] = []
  const query = createQuery()

  $: query.query(tags.class.TagReference, { attachedTo: object._id }, (result) => {
    items = result
  })
  async function tagsHandler (evt: MouseEvent): Promise<void> {
    showPopup(TagsEditorPopup, { object }, getEventPopupPositionElement(evt))
  }

  let allWidth: number
  const widths: number[] = []

  afterUpdate(() => {
    let count: number = 0
    widths.forEach((i) => (count += i))
    full = count > allWidth
    dispatch('change', { full, ckeckFilled })
  })
</script>

<div
  class="labels-container"
  style:justify-content={kind === 'short' ? 'space-between' : 'flex-start'}
  style:flex-wrap={kind === 'short' ? 'nowrap' : 'wrap'}
  use:resizeObserver={(element) => {
    allWidth = element.clientWidth
  }}
  on:click|stopPropagation={(evt) => {
    if (isEditable) tagsHandler(evt)
    else action(evt)
  }}
>
  {#each items as value, i}
    <div class="label-box wrap-{kind}">
      <TagReferencePresenter {value} kind={'kanban-labels'} bind:realWidth={widths[i]} />
    </div>
  {/each}
</div>

<style lang="scss">
  .labels-container {
    overflow: hidden;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    min-width: 0;
    border-radius: 0.25rem;
  }

  .label-box {
    display: flex;
    align-items: center;
    flex-shrink: 10;
    width: auto;
    min-width: 0;
    border-radius: 0.25rem;
    transition: box-shadow 0.15s ease-in-out;

    &:last-child {
      flex-shrink: 0;
    }
  }
  .wrap-short:not(:last-child) {
    margin-right: 0.375rem;
  }
  .wrap-full {
    margin: 0.125rem;
  }
</style>
