<!--
// Copyright © 2021 Anticrm Platform Contributors.
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
  import type { Action } from '@anticrm/ui'
  import { ActionIcon, Icon, Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  export let icon: Asset | undefined = undefined
  export let label: IntlString | undefined = undefined
  export let notifications = 0
  export let actions: Action[] = []
  export let selected: boolean = false
  export let indent: 'default' | 'ml-2' | 'ml-4' | 'ml-8' = 'default'

  const dispatch = createEventDispatcher()
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class="antiNav-element"
  class:selected
  class:ml-2={indent === 'ml-2'}
  class:ml-4={indent === 'ml-4'}
  class:ml-8={indent === 'ml-8'}
  on:click|stopPropagation={() => {
    dispatch('click')
  }}
>
  <div class="an-element__icon">
    {#if icon}
      <Icon {icon} size={'small'} />
    {/if}
  </div>
  <span class="an-element__label title">
    {#if label}<Label {label} />{:else}{label}{/if}
  </span>
  {#each actions as action}
    <div class="an-element__tool">
      <ActionIcon label={action.label} icon={action.icon} size={'small'} action={(evt) => action.action({}, evt)} />
    </div>
  {/each}
  {#if notifications > 0}
    <div class="an-element__counter">{notifications}</div>
  {/if}
</div>
