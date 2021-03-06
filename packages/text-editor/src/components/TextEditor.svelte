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
  import { IntlString, translate } from '@anticrm/platform'

  import { AnyExtension, Editor, Extension, HTMLContent } from '@tiptap/core'
  import Highlight from '@tiptap/extension-highlight'
  import Link from '@tiptap/extension-link'
  // import Typography from '@tiptap/extension-typography'
  import Placeholder from '@tiptap/extension-placeholder'
  import StarterKit from '@tiptap/starter-kit'
  import TaskList from '@tiptap/extension-task-list'
  import TaskItem from '@tiptap/extension-task-item'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import textEditorPlugin from '../plugin'
  import { FormatMode } from '../types'

  export let content: string = ''
  export let placeholder: IntlString = textEditorPlugin.string.EditorPlaceholder
  export let extensions: AnyExtension[] = []
  export let supportSubmit = true

  let element: HTMLElement
  let editor: Editor

  let placeHolderStr: string = ''

  $: ph = translate(placeholder, {}).then((r) => {
    placeHolderStr = r
  })

  const dispatch = createEventDispatcher()

  export function submit (): void {
    content = editor.getHTML()
    dispatch('content', content)
  }

  export function clear (): void {
    content = ''
    editor.commands.clearContent(false)
  }
  export function insertText (text: string): void {
    editor.commands.insertContent(text as HTMLContent)
  }
  export function checkIsActive (formatMode: FormatMode) {
    return editor.isActive(formatMode)
  }
  export function toggleBold () {
    editor.commands.toggleBold()
  }
  export function toggleItalic () {
    editor.commands.toggleItalic()
  }
  export function toggleStrike () {
    editor.commands.toggleStrike()
  }
  export function getLink () {
    return editor.getAttributes('link').href
  }
  export function unsetLink () {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }
  export function setLink (link: string) {
    editor.chain().focus().extendMarkRange('link').setLink({ href: link }).run()
  }
  export function checkIsSelectionEmpty () {
    return editor.view.state.selection.empty
  }
  export function toggleOrderedList () {
    editor.commands.toggleOrderedList()
  }
  export function toggleBulletList () {
    editor.commands.toggleBulletList()
  }
  export function toggleBlockquote () {
    editor.commands.toggleBlockquote()
  }
  export function toggleCode () {
    editor.commands.toggleCode()
  }
  export function toggleCodeBlock () {
    editor.commands.toggleCodeBlock()
  }
  let needFocus = false
  export function focus (): void {
    needFocus = true
  }

  $: if (editor && needFocus) {
    editor.commands.focus()
    needFocus = false
  }

  const Handle = Extension.create({
    addKeyboardShortcuts () {
      return {
        'Shift-Enter': () => {
          const res = this.editor.commands.splitListItem('listItem')
          if (!res) {
            this.editor.commands.first(({ commands }) => [
              () => commands.newlineInCode(),
              () => commands.createParagraphNear(),
              () => commands.liftEmptyBlock(),
              () => commands.splitBlock()
            ])
          }
          return true
        },
        Enter: () => {
          submit()
          return true
        },
        Space: () => {
          if (editor.isActive('link')) {
            this.editor.commands.toggleMark('link')
          }
          return false
        }
      }
    }
  })

  onMount(() => {
    ph.then(() => {
      editor = new Editor({
        element,
        content: content,
        extensions: [
          StarterKit,
          Highlight,
          Link.configure({ openOnClick: false }),
          ...(supportSubmit ? [Handle] : []), // order important
          // Typography, // we need to disable 1/2 -> ½ rule (https://github.com/hcengineering/anticrm/issues/345)
          Placeholder.configure({ placeholder: placeHolderStr }),
          TaskList,
          TaskItem.configure({
            nested: true,
            HTMLAttributes: {
              class: 'flex flex-grow gap-1 checkbox_style'
            }
          }),
          ...extensions
        ],
        onTransaction: () => {
          // force re-render so `editor.isActive` works as expected
          editor = editor
        },
        onBlur: () => {
          dispatch('blur', editor.getHTML())
        },
        onFocus: () => {
          dispatch('focus', editor.getHTML())
        },
        onUpdate: () => {
          content = editor.getHTML()
          dispatch('value', content)
        },
        onSelectionUpdate: () => dispatch('selection-update')
      })
    })
  })

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })
</script>

<div class="select-text" style="width: 100%;" bind:this={element} />

<style lang="scss" global>
  .ProseMirror {
    overflow-y: auto;
    max-height: 40vh;
    outline: none;
    line-height: 150%;
    color: var(--accent-color);

    p:not(:last-child) {
      margin-block-end: 1em;
    }

    > * + * {
      margin-top: 0.75em;
    }

    /* Placeholder (at the top) */
    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--dark-color);
      pointer-events: none;
      height: 0;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--theme-bg-accent-hover);
    }
    &::-webkit-scrollbar-corner {
      background-color: var(--theme-bg-accent-hover);
    }
    &::-webkit-scrollbar-track {
      margin: 0;
    }
  }
</style>
