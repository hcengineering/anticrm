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
  import type { Asset } from '@anticrm/platform'
  import type { AnySvelteComponent } from '../types'
  import Icon from './Icon.svelte'

  export let icon: Asset | AnySvelteComponent | undefined
  export let size: 'small' | 'medium' | 'large' | 'x-large' = 'large'
  export let transparent: boolean = false
  export let selected: boolean = false
  export let primary: boolean = false
  export let id: string | undefined = undefined
</script>

<div
  {id}
  class="flex-center icon-button icon-{size}"
  class:selected
  class:transparent
  class:primary
  on:click|stopPropagation
  on:mousemove
>
  <div class="content">
    {#if $$slots.content}
      <slot name="content" />
    {:else if icon}
      <Icon {icon} size={'full'} />
    {/if}
  </div>
</div>

<style lang="scss">
  .icon-button {
    flex-shrink: 0;
    color: var(--theme-caption-color);
    border: 1px solid var(--theme-circle-border);
    border-radius: 50%;
    cursor: pointer;

    .content {
      pointer-events: none;
    }
    &.selected {
      background-color: var(--theme-circle-select);
    }
    &.transparent {
      background-color: var(--theme-circle-trans);
    }
    &.primary {
      color: var(--primary-button-color);
      background-color: var(--primary-button-enabled);
      border-color: var(--primary-button-border);
      &:hover {
        background-color: var(--primary-button-hovered);
      }
      &:active {
        background-color: var(--primary-button-pressed);
      }
    }
  }
  .icon-small {
    width: 1.5rem;
    height: 1.5rem;
    .content {
      width: 0.75rem;
      height: 0.75rem;
    }
  }
  .icon-medium {
    width: 1.75rem;
    height: 1.75rem;
    .content {
      width: 0.875rem;
      height: 0.875rem;
    }
  }
  .icon-large {
    width: 2rem;
    height: 2rem;
    .content {
      width: 1rem;
      height: 1rem;
    }
  }
  .icon-x-large {
    width: 2.25rem;
    height: 2.25rem;
    .content {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
</style>
