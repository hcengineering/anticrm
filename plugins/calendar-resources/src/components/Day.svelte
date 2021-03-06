<!--
// Copyright © 2022 Hardcore Engineering Inc.
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
  import { Event } from '@anticrm/calendar'
  import { Class, Doc, DocumentQuery, FindOptions, Ref } from '@anticrm/core'
  import { addZero, Label, tooltip, getPlatformColorForText } from '@anticrm/ui'
  import { BuildModelKey } from '@anticrm/view'
  import { createEventDispatcher } from 'svelte'
  import calendar from '../plugin'
  import EventsPopup from './EventsPopup.svelte'

  export let events: Event[]
  export let date: Date
  export let size: 'small' | 'huge' = 'small'

  export let _class: Ref<Class<Doc>>
  export let query: DocumentQuery<Event> = {}
  export let options: FindOptions<Event> | undefined = undefined
  export let baseMenuClass: Ref<Class<Event>> | undefined = undefined
  export let config: (string | BuildModelKey)[]

  export let today: boolean = false
  export let selected: boolean = false
  export let wrongMonth: boolean = false

  const dispatch = createEventDispatcher()
  const eventCount = 3

  $: tip =
    events.length > 0
      ? {
          label: calendar.string.Events,
          component: EventsPopup,
          props: { value: events, _class, query, options, baseMenuClass, config }
        }
      : undefined
</script>

{#if size === 'huge'}
  <div class="flex-grow h-full w-full p-1 flex-col" use:tooltip={tip}>
    <div class="flex flex-reverse fs-title">
      <div
        class="date flex-center"
        class:today
        class:selected
        class:wrongMonth
        on:click={() => {
          dispatch('select', date)
        }}
      >
        {date.getDate()}
      </div>
    </div>
    <div
      class="flex-col flex-grow mt-1"
      on:click={() => {
        dispatch('create', date)
      }}
    >
      {#each events.slice(0, eventCount) as e}
        <div
          class="overflow-label mt-1 py-1 flex flex-between event"
          style="background-color: {getPlatformColorForText(e._class)};"
        >
          {e.title}
          <div>
            {addZero(new Date(e.date).getHours())}:{addZero(new Date(e.date).getMinutes())}
          </div>
        </div>
      {/each}
      {#if events.length > eventCount}
        <div class="mt-1">
          <Label label={calendar.string.AndMore} params={{ count: events.length - eventCount }} />
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="w-full h-full relative flex-center cell" class:today class:selected class:wrongMonth use:tooltip={tip}>
    {date.getDate()}
    {#if events.length > 0}
      <div class="marker" />
    {/if}
  </div>
{/if}

<style lang="scss">
  .event {
    border-radius: 0.5rem;
    padding: 0rem 0.5rem;
    color: var(--accent-color);
  }
  .date {
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.25rem;
  }
  .cell {
    border-radius: 0.5rem;
    border: 1px solid transparent;
  }
  .today {
    color: var(--caption-color);
    background-color: var(--primary-button-enabled);
    border-color: var(--primary-button-focused-border);
  }
  .selected:not(.today, .wrongMonth) {
    color: var(--caption-color);
    background-color: var(--primary-button-disabled);
    border-color: var(--primary-button-focused-border);
  }
  .marker {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    width: 0.25rem;
    height: 0.25rem;
    border-radius: 50%;
    background-color: var(--highlight-red);
  }
</style>
