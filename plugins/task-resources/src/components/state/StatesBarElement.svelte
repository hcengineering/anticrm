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
  import { afterUpdate } from 'svelte'
  import type { StatesBarPosition } from '../..'

  export let label: string
  export let position: StatesBarPosition = undefined
  export let selected: boolean = false
  export let color: string = 'var(--theme-button-bg-enabled)'

  let lenght: number = 0
  let text: HTMLElement
  let divBar: HTMLElement
  let svgBack: SVGElement

  afterUpdate(() => {
    if (text) lenght = text.clientWidth + 32 > 300 ? 300 : text.clientWidth + 32
  })
</script>

<div class="hidden-text text-md font-medium" bind:this={text}>{label}</div>
{#if lenght > 0}
  <div
    bind:this={divBar}
    class="asb-bar"
    class:selected
    class:cursor-pointer={!selected}
    class:cursor-default={selected}
    on:click|stopPropagation
  >
    <svg
      bind:this={svgBack}
      class="asb-bar__back"
      viewBox="0 0 {lenght} 24"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      {#if position === 'start'}
        <path
          class="asb-bar__{selected ? 'selected' : 'element'}"
          style={selected ? `fill: ${color};` : ''}
          d="M0,5.3C0,2.4,2.3,0,5.2,0h1.3h{lenght -
            13}h1.2c0.5,0,1,0.3,1.2,0.9l4,10.7c0.1,0.3,0.1,0.7,0,0.9l-4,10.7c-0.2,0.5-0.7,0.9-1.2,0.9 l-1.2,0h-{lenght -
            13}H5.2C2.3,24,0,21.6,0,18.7V5.3z"
        />
      {:else if position === 'middle'}
        <path
          class="asb-bar__{selected ? 'selected' : 'element'}"
          style={selected ? `fill: ${color};` : ''}
          d="M4,11.5L0.1,0.9C-0.1,0.5,0.2,0,0.6,0h5.8h{lenght -
            13}h1.2c0.5,0,1,0.3,1.2,0.9l4,10.7c0.1,0.3,0.1,0.7,0,0.9l-4,10.7 c-0.2,0.5-0.7,0.9-1.2,0.9h-1.2h-{lenght -
            13}H0.6c-0.5,0-0.8-0.5-0.6-0.9L4,12.5C4.1,12.2,4.1,11.8,4,11.5z"
        />
      {:else if position === 'end'}
        <path
          class="asb-bar__{selected ? 'selected' : 'element'}"
          style={selected ? `fill: ${color};` : ''}
          d="M4.1,11.5l-4-10.6C-0.1,0.5,0.2,0,0.7,0h{lenght - 7}C{lenght -
            3},0,{lenght},2.4,{lenght},5.3v13.3c0,2.9-2.4,5.3-5.3,5.3h-{lenght}H0.6c-0.5,0-0.8-0.5-0.6-0.9L4,12.5C4.1,12.2,4.1,11.8,4,11.5z"
        />
      {:else}
        <path
          class="asb-bar__{selected ? 'selected' : 'element'}"
          style={selected ? `fill: ${color};` : ''}
          d="M0,5.3C0,2.4,2.3,0,5.2,0h1.3h{lenght}h1.3C49.7,0,52,2.4,52,5.3v13.3c0,2.9-2.3,5.3-5.2,5.3h-1.3h-{lenght}H5.2 C2.3,24,0,21.6,0,18.7V5.3z"
        />
      {/if}
    </svg>
    <div class="asb-label__container" class:selected><div class="overflow-label">{label}</div></div>
  </div>
{/if}
