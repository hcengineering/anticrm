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
  import { afterUpdate, createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { generateId } from '@anticrm/core'
  import ui from '../plugin'
  import { closePopup, showPopup } from '../popups'
  import { Action } from '../types'
  import Icon from './Icon.svelte'
  import Label from './Label.svelte'
  import MouseSpeedTracker from './MouseSpeedTracker.svelte'
  import { resizeObserver } from '../resize'

  export let actions: Action[] = []
  export let ctx: any = undefined

  const dispatch = createEventDispatcher()
  const btns: HTMLElement[] = []
  let activeElement: HTMLElement
  const category = generateId()

  const keyDown = (ev: KeyboardEvent): void => {
    if (ev.key === 'Tab') {
      dispatch('close')
      ev.preventDefault()
      ev.stopPropagation()
    }
    const n = btns.indexOf(activeElement) ?? 0
    if (ev.key === 'ArrowDown') {
      if (n < btns.length - 1) {
        activeElement = btns[n + 1]
      }
      ev.preventDefault()
      ev.stopPropagation()
    }
    if (ev.key === 'ArrowUp') {
      if (n > 0) {
        activeElement = btns[n - 1]
      }
      ev.preventDefault()
      ev.stopPropagation()
    }
    if (ev.key === 'ArrowLeft') {
      dispatch('update', 'left')
      closePopup(category)
      ev.preventDefault()
      ev.stopPropagation()
    }
    if (ev.key === 'ArrowRight') {
      dispatch('update', 'right')
      showActionPopup(actions[n], activeElement)
      ev.preventDefault()
      ev.stopPropagation()
    }
  }

  afterUpdate(() => {
    dispatch('changeContent', true)
  })
  onMount(() => {
    if (btns[0]) {
      btns[0].focus()
    }
  })
  onDestroy(() => {
    closePopup(category)
  })

  function showActionPopup (action: Action, target: HTMLElement): void {
    closePopup(category)
    if (action.component !== undefined) {
      console.log(action.props)
      showPopup(
        action.component,
        action.props,
        { getBoundingClientRect: () => target.getBoundingClientRect(), kind: 'submenu' },
        (evt) => {
          dispatch('close')
        },
        undefined,
        { category, overlay: false }
      )
    }
  }
  function focusTarget (action: Action, target: HTMLElement): void {
    if (focusSpeed && target !== activeElement) {
      activeElement = target
      showActionPopup(action, target)
    }
  }
  export function clearFocus (): void {
    closePopup(category)
    activeElement = popup
  }

  let focusSpeed: boolean = false
  let popup: HTMLElement

  $: popup?.focus()
</script>

<div
  class="antiPopup"
  use:resizeObserver={() => {
    dispatch('changeContent', true)
  }}
  on:keydown={keyDown}
>
  <MouseSpeedTracker bind:focusSpeed />
  <div class="ap-space" />
  <slot name="header" />
  <div class="ap-scroll">
    <div class="ap-box" bind:this={popup}>
      {#if actions.length === 0}
        <div class="p-6 error-color">
          <Label label={ui.string.NoActionsDefined} />
        </div>
      {/if}
      {#each actions as action, i}
        {#if i > 0 && actions[i - 1].group !== action.group}
          <span class="ap-menuItem separator" />
        {/if}
        {#if action.link}
          <a class="stealth" href={action.link}>
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <button
              bind:this={btns[i]}
              class="ap-menuItem flex-row-center withIcon w-full"
              class:hover={btns[i] === activeElement}
              on:mouseover={(evt) => focusTarget(action, btns[i])}
              on:click|preventDefault|stopPropagation={(evt) => {
                if (!action.inline) dispatch('close')
                action.action(ctx, evt)
              }}
            >
              {#if action.icon}<div class="icon mr-3"><Icon icon={action.icon} size={'small'} /></div>{/if}
              <span class="overflow-label pr-1 flex-grow"><Label label={action.label} /></span>
            </button>
          </a>
        {:else if action.component !== undefined}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <button
            bind:this={btns[i]}
            class="ap-menuItem antiPopup-submenu withIconHover"
            class:hover={btns[i] === activeElement}
            on:mouseover={() => focusTarget(action, btns[i])}
            on:click={() => focusTarget(action, btns[i])}
          >
            {#if action.icon}
              <div class="icon mr-3"><Icon icon={action.icon} size={'small'} /></div>
            {/if}
            <span class="overflow-label pr-1 flex-grow"><Label label={action.label} /></span>
          </button>
        {:else}
          <!-- svelte-ignore a11y-mouse-events-have-key-events -->
          <button
            bind:this={btns[i]}
            class="ap-menuItem flex-row-center withIcon"
            class:hover={btns[i] === activeElement}
            on:mouseover={() => focusTarget(action, btns[i])}
            on:click={(evt) => {
              if (!action.inline) dispatch('close')
              action.action(ctx, evt)
            }}
          >
            {#if action.icon}
              <div class="icon mr-3"><Icon icon={action.icon} size={'small'} /></div>
            {/if}
            <span class="overflow-label pr-1 flex-grow"><Label label={action.label} /></span>
          </button>
        {/if}
      {/each}
    </div>
  </div>
  <div class="ap-space" />
</div>
