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
  import { Class, Doc, Ref, SortingOrder } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import { DoneState, SpaceWithStates } from '@anticrm/task'
  import { getPlatformColor, Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import task from '../../plugin'
  import Won from '../icons/Won.svelte'
  import Lost from '../icons/Lost.svelte'
  import Unknown from '../icons/Unknown.svelte'

  export let space: Ref<SpaceWithStates>
  let states: DoneState[] = []
  const dispatch = createEventDispatcher()
  const statesQuery = createQuery()
  statesQuery.query(
    task.class.DoneState,
    { space },
    (res) => {
      states = res
    },
    {
      sort: {
        _class: SortingOrder.Descending,
        rank: SortingOrder.Ascending
      }
    }
  )
  function getColor (_class: Ref<Class<Doc>>): string {
    return _class === task.class.WonState ? getPlatformColor(0) : getPlatformColor(11)
  }
</script>

<div class="selectPopup">
  <div class="scroll">
    <div class="box">
      {#each states as state}
        <button
          class="menu-item"
          on:click={() => {
            dispatch('close', state)
          }}
        >
          <div class="mr-2" style="color: {getColor(state._class)}">
            <svelte:component this={state._class === task.class.WonState ? Won : Lost} size={'small'} />
          </div>
          <span class="label">{state.title}</span>
        </button>
      {/each}
      <button
        class="menu-item"
        on:click={() => {
          dispatch('close', null)
        }}
      >
        <div class="dark-color mr-2"><Unknown size={'small'} /></div>
        <span class="overflow-label"><Label label={task.string.NoDoneState} /></span>
      </button>
    </div>
  </div>
</div>
