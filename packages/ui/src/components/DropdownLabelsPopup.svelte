<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import type { IntlString } from '@anticrm/platform'
  import { translate } from '@anticrm/platform'
  import { createEventDispatcher, onMount } from 'svelte'
  import type { DropdownTextItem } from '../types'
  import plugin from '../plugin'
  import CheckBox from './CheckBox.svelte'
  import ListView from './ListView.svelte'

  export let placeholder: IntlString = plugin.string.SearchDots
  export let items: DropdownTextItem[]
  export let selected: DropdownTextItem['id'] | undefined = undefined

  let search: string = ''
  let phTraslate: string = ''
  $: translate(placeholder, {}).then((res) => {
    phTraslate = res
  })
  const dispatch = createEventDispatcher()
  let searchInput: HTMLInputElement

  onMount(() => {
    if (searchInput) searchInput.focus()
  })

  let selection = 0
  let list: ListView

  $: objects = items.filter((x) => x.label.toLowerCase().includes(search.toLowerCase()))

  async function handleSelection (evt: Event | undefined, selection: number): Promise<void> {
    const item = objects[selection]

    dispatch('close', item.id)
  }

  function onKeydown (key: KeyboardEvent): void {
    if (key.code === 'ArrowUp') {
      key.stopPropagation()
      key.preventDefault()
      list.select(selection - 1)
    }
    if (key.code === 'ArrowDown') {
      key.stopPropagation()
      key.preventDefault()
      list.select(selection + 1)
    }
    if (key.code === 'Enter') {
      key.preventDefault()
      key.stopPropagation()
      handleSelection(key, selection)
    }
    if (key.code === 'Escape') {
      key.preventDefault()
      key.stopPropagation()
      dispatch('close')
    }
  }
</script>

<div class="selectPopup" on:keydown={onKeydown}>
  <div class="header">
    <input
      bind:this={searchInput}
      type="text"
      bind:value={search}
      placeholder={phTraslate}
      on:input={(ev) => {}}
      on:change
    />
  </div>
  <div class="scroll">
    <div class="box">
      <ListView bind:this={list} count={objects.length} bind:selection>
        <svelte:fragment slot="item" let:item={idx}>
          {@const item = objects[idx]}

          <button
            class="menu-item flex-between w-full"
            on:click={() => {
              dispatch('close', item.id)
            }}
          >
            <div class="flex-grow caption-color lines-limit-2">{item.label}</div>
            {#if item.id === selected}
              <div class="check-right"><CheckBox checked primary /></div>
            {/if}
          </button>
        </svelte:fragment>
      </ListView>
    </div>
  </div>
</div>
