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
  import Label from './Label.svelte'

  export let label: IntlString | undefined = undefined
  export let width: string | undefined = undefined
  export let value: string | undefined = undefined
  export let error: string | undefined = undefined
  export let password: boolean | undefined = undefined
  export let id: string | undefined = undefined
  export let name: string | undefined = undefined
</script>

<div class="editbox{error ? ' error' : ''}" style={width ? 'width: ' + width : ''}>
  {#if password}
    <input
      type="password"
      class:nolabel={!label}
      {id}
      {name}
      bind:value
      on:blur
      on:change
      on:keyup
      on:input
      autocomplete="off"
      placeholder=" "
    />
  {:else}
    <input
      type="text"
      class:nolabel={!label}
      {id}
      {name}
      bind:value
      on:blur
      on:change
      on:keyup
      on:input
      autocomplete="off"
      placeholder=" "
    />
  {/if}
  {#if label}
    <div class="label"><Label {label} /></div>
  {/if}
</div>

<style lang="scss">
  .editbox {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 0;
    min-width: 3rem;
    height: 3.25rem;
    background-color: var(--theme-bg-accent-color);
    border: 1px solid var(--theme-bg-accent-hover);
    border-radius: 0.75rem;
    &:focus-within {
      background-color: var(--theme-bg-focused-color);
      border-color: var(--theme-bg-focused-border);
    }
    input {
      height: 3.25rem;
      margin: 0;
      padding: 0.875rem 1.25rem 0px;
      background-color: transparent;
      border: none;
      border-radius: 0.75rem;
    }
    .nolabel {
      padding-top: 0;
    }

    .label {
      position: absolute;
      top: 1rem;
      left: 1.25rem;
      font-size: 0.75rem;
      color: var(--theme-caption-color);
      opacity: 0.3;
      transition: top 200ms;
      pointer-events: none;
      user-select: none;
    }
    input:focus + .label,
    input:not(:placeholder-shown) + .label {
      top: 0.5rem;
    }
  }
  .error {
    border: 1px solid var(--system-error-60-color);
    &:focus-within {
      border-color: var(--system-error-color);
    }
  }
</style>
