<script lang="ts">
  import { IntlString } from '@anticrm/platform'
  import { Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import textEditorPlugin from '../plugin'
  import StyledTextEditor from './StyledTextEditor.svelte'

  export let label: IntlString | undefined = undefined
  export let content: string
  export let placeholder: IntlString = textEditorPlugin.string.EditorPlaceholder

  export let showButtons = true
  export let focus = false

  let rawValue: string
  let oldContent = ''

  $: if (oldContent !== content) {
    oldContent = content
    rawValue = content
  }

  let textEditor: StyledTextEditor

  export function submit (): void {
    textEditor.submit()
  }
  const dispatch = createEventDispatcher()
  let focused = false

  let needFocus = focus

  $: if (textEditor && needFocus) {
    textEditor.focus()
    needFocus = false
  }
</script>

<div
  class="antiComponent styled-box"
  on:click={() => {
    if (focused) {
      textEditor?.focus()
    }
  }}
>
  {#if label}
    <div class="label"><Label {label} /></div>
  {/if}
  <StyledTextEditor
    {placeholder}
    {showButtons}
    isScrollable={false}
    bind:content={rawValue}
    bind:this={textEditor}
    on:focus={() => {
      focused = true
    }}
    on:blur={() => {
      focused = false
      dispatch('value', rawValue)
      content = rawValue
    }}
    on:value={(evt) => {
      rawValue = evt.detail
    }}
  />
</div>

<style lang="scss">
  .styled-box {
    flex-grow: 1;

    .label {
      padding-bottom: 0.25rem;
      font-size: 0.75rem;
      color: var(--theme-caption-color);
      opacity: 0.3;
      transition: top 200ms;
      pointer-events: none;
      user-select: none;
    }
  }
</style>
