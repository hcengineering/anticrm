<script lang="ts">
  import { IntlString } from '@anticrm/platform'
  import presentation, { MessageViewer } from '@anticrm/presentation'
  import { ActionIcon, IconCheck, IconClose, IconEdit, Label, ShowMore } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import textEditorPlugin from '../plugin'
  import StyledTextEditor from './StyledTextEditor.svelte'

  export let label: IntlString | undefined = undefined
  export let content: string
  export let placeholder: IntlString = textEditorPlugin.string.EditorPlaceholder

  export let emphasized: boolean = false
  export let alwaysEdit: boolean = false
  export let showButtons: boolean = true
  export let hideExtraButtons: boolean = false
  export let maxHeight: 'max' | 'card' | string = 'max'
  export let previewLimit: number = 240
  export let previewUnlimit: boolean = false
  export let focusable: boolean = false

  const Mode = {
    View: 1,
    Edit: 2
  }
  export let mode = Mode.View

  export function startEdit (): void {
    rawValue = content ?? ''
    needFocus = true
    mode = Mode.Edit
  }
  export function saveEdit (): void {
    dispatch('value', rawValue)
    content = rawValue
    mode = Mode.View
  }
  export function cancelEdit (): void {
    rawValue = content
    mode = Mode.View
  }

  let rawValue: string
  let oldContent = ''
  let modified: boolean = false

  $: if (oldContent !== content) {
    oldContent = content
    rawValue = content
    modified = false
  }
  $: if (!modified && rawValue !== content) modified = true
  $: dispatch('change', modified)

  let textEditor: StyledTextEditor

  export function submit (): void {
    textEditor.submit()
  }
  const dispatch = createEventDispatcher()
  let focused = false

  let needFocus = false

  $: if (textEditor && needFocus) {
    textEditor.focus()
    needFocus = false
  }
</script>

<div
  class="antiComponent styled-box"
  class:emphasized
  class:emphasized-focus={(mode === Mode.Edit || alwaysEdit) && focused}
  on:click={() => {
    if (alwaysEdit && focused) {
      textEditor?.focus()
    }
  }}
>
  {#if label}
    <div class="label"><Label {label} /></div>
  {/if}
  {#if mode !== Mode.View || alwaysEdit}
    <StyledTextEditor
      {placeholder}
      {showButtons}
      {maxHeight}
      {focusable}
      bind:content={rawValue}
      bind:this={textEditor}
      on:focus={() => {
        focused = true
      }}
      on:blur={() => {
        focused = false
        if (alwaysEdit) {
          dispatch('value', rawValue)
          content = rawValue
        }
      }}
      on:value={(evt) => {
        rawValue = evt.detail
      }}
    >
      {#if !alwaysEdit && !hideExtraButtons}
        <div class="flex flex-reverse flex-grow gap-2 reverse">
          <ActionIcon
            icon={IconCheck}
            size={'medium'}
            direction={'bottom'}
            label={presentation.string.Save}
            action={saveEdit}
          />
          <ActionIcon
            size={'medium'}
            icon={IconClose}
            direction={'top'}
            label={presentation.string.Cancel}
            action={cancelEdit}
          />
        </div>
      {/if}
    </StyledTextEditor>
  {:else}
    <div class="flex-col">
      {#if content}
        <ShowMore limit={previewLimit} ignore={previewUnlimit}>
          <MessageViewer message={content} />
        </ShowMore>
      {/if}
    </div>
    {#if !alwaysEdit && !hideExtraButtons}
      <div class="flex flex-reverse">
        <ActionIcon
          size={'medium'}
          icon={IconEdit}
          direction={'top'}
          label={textEditorPlugin.string.Edit}
          action={startEdit}
        />
      </div>
    {/if}
  {/if}
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
  .emphasized {
    padding: 1rem;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 0.5rem;
    &.emphasized-focus {
      background-color: var(--theme-bg-focused-color);
      border-color: var(--theme-bg-focused-border);
    }
  }
</style>
