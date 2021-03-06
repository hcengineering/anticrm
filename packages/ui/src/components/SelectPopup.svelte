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
  import type { Asset, IntlString } from '@anticrm/platform'
  import { afterUpdate, createEventDispatcher } from 'svelte'
  import { createFocusManager } from '../focus'
  import EditBox from './EditBox.svelte'
  import FocusHandler from './FocusHandler.svelte'
  import Icon from './Icon.svelte'
  import IconCheck from './icons/Check.svelte'
  import Label from './Label.svelte'
  import ListView from './ListView.svelte'
  import type { AnySvelteComponent } from '../types'
  import { resizeObserver } from '../resize'

  interface ValueType {
    id: number | string
    icon?: Asset
    iconColor?: string
    label?: IntlString
    text?: string
    isSelected?: boolean

    component?: AnySvelteComponent
    props?: Record<string, any>
  }

  export let placeholder: IntlString | undefined = undefined
  export let placeholderParam: any | undefined = undefined
  export let searchable: boolean = false
  export let value: Array<ValueType>
  export let width: 'medium' | 'large' | 'full' = 'medium'
  export let size: 'small' | 'medium' | 'large' = 'small'

  let search: string = ''

  const dispatch = createEventDispatcher()

  $: hasSelected = value.some((v) => v.isSelected)

  let selection = 0
  let list: ListView

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
      dispatch('close', value[selection].id)
    }
    if (key.code === 'Escape') {
      key.preventDefault()
      key.stopPropagation()
      dispatch('close')
    }
  }
  const manager = createFocusManager()

  $: filteredObjects = value.filter((el) => (el.label ?? el.text ?? '').toLowerCase().includes(search.toLowerCase()))

  $: huge = size === 'medium' || size === 'large'

  afterUpdate(() => dispatch('changeContent', true))
</script>

<FocusHandler {manager} />

<div
  class="selectPopup"
  class:full-width={width === 'full'}
  class:max-width-40={width === 'large'}
  use:resizeObserver={() => {
    dispatch('changeContent', true)
  }}
  on:keydown={onKeydown}
>
  {#if searchable}
    <div class="header">
      <EditBox
        kind={'search-style'}
        focusIndex={1}
        focus
        bind:value={search}
        {placeholder}
        {placeholderParam}
        on:change
      />
    </div>
  {/if}
  <div class="scroll">
    <div class="box">
      <ListView
        bind:this={list}
        count={filteredObjects.length}
        bind:selection
        on:changeContent={() => dispatch('changeContent', true)}
      >
        <svelte:fragment slot="item" let:item={itemId}>
          {@const item = filteredObjects[itemId]}
          <button
            class="menu-item  w-full"
            on:click={() => dispatch('close', item.id)}
            on:focus={() => dispatch('update', item)}
            on:mouseover={() => dispatch('update', item)}
          >
            <div class="flex-row-center" class:mt-2={huge} class:mb-2={huge}>
              {#if hasSelected}
                <div class="icon">
                  {#if item.isSelected}
                    <Icon icon={IconCheck} {size} />
                  {/if}
                </div>
              {/if}
              {#if item.component}
                <svelte:component this={item.component} {...item.props} />
              {:else}
                {#if item.icon}
                  <div class="mr-2">
                    <Icon icon={item.icon} fill={item.iconColor} {size} />
                  </div>
                {/if}
                <span class="label" class:text-base={huge}>
                  {#if item.label}
                    <Label label={item.label} />
                  {:else if item.text}
                    <span>{item.text}</span>
                  {/if}
                </span>
              {/if}
            </div>
          </button>
        </svelte:fragment>
      </ListView>
    </div>
  </div>
</div>
