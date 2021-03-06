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
  import { Class, Doc, Ref, RefTo } from '@anticrm/core'
  import { translate } from '@anticrm/platform'
  import { getClient } from '@anticrm/presentation'
  import type { State } from '@anticrm/task'
  import task from '@anticrm/task'
  import { eventToHTMLElement, Icon, IconClose, Label, showPopup } from '@anticrm/ui'
  import { Filter, FilterMode } from '@anticrm/view'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import view from '../../plugin'

  export let _class: Ref<Class<Doc>>
  export let filter: Filter

  $: currentFilter = filter.nested ? filter.nested : filter

  const client = getClient()
  const hierarchy = client.getHierarchy()

  function getTargetClass (): Ref<Class<Doc>> | undefined {
    try {
      return (hierarchy.getAttribute(_class, filter.key.key).type as RefTo<Doc>).to
    } catch (err: any) {
      console.error(err)
    }
  }
  const targetClass = getTargetClass()
  $: isState = targetClass === task.class.State ?? false
  const dispatch = createEventDispatcher()

  async function getCountStates (ids: Ref<Doc>[]): Promise<number> {
    if (targetClass === undefined) {
      return 0
    }
    const selectStates = await client.findAll(targetClass, { _id: { $in: Array.from(ids) } }, {})
    const unique = new Set(selectStates.map((s) => (s as State).title))
    return unique.size
  }

  let countLabel: string = ''
  async function getLabel (): Promise<void> {
    const count = isState ? await getCountStates(filter.value) : filter.value.length
    countLabel = await translate(view.string.FilterStatesCount, { value: count })
  }
  $: if (filter) getLabel()

  async function toggle (nested: boolean = false) {
    if (nested && filter.nested !== undefined) {
      const index = filter.nested.modes.findIndex((p) => p === filter.nested?.mode)
      filter.nested.mode = filter.nested.modes[(index + 1) % filter.nested.modes.length]
    } else {
      const index = filter.modes.findIndex((p) => p === filter.mode)
      filter.mode = filter.modes[(index + 1) % filter.modes.length]
    }
    dispatch('change')
  }

  async function getMode (mode: Ref<FilterMode>): Promise<FilterMode | undefined> {
    return await client.findOne(view.class.FilterMode, { _id: mode })
  }

  function onChange (e: Filter | undefined) {
    if (filter.nested !== undefined) {
      filter.nested = filter
    } else {
      filter = filter
    }
    dispatch('change')
  }

  onDestroy(() => {
    filter.nested?.onRemove?.()
    filter.onRemove?.()
  })

  $: modeValuePromise = getMode(filter.mode)
</script>

<div class="filter-section">
  <button class="filter-button left-round">
    {#if filter.key.icon}
      <div class="btn-icon mr-1-5">
        <Icon icon={filter.key.icon} size={'x-small'} />
      </div>
    {/if}
    <span><Label label={filter.key.label} /></span>
  </button>
  <button
    class="filter-button"
    on:click={() => {
      toggle()
    }}
  >
    {#await modeValuePromise then mode}
      {#if mode?.label}
        <span><Label label={mode.label} params={{ value: filter.value.length }} /></span>
      {/if}
    {/await}
  </button>
  {#if filter.nested}
    <button class="filter-button">
      {#if filter.nested.key.icon}
        <div class="btn-icon mr-1-5">
          <Icon icon={filter.nested.key.icon} size={'x-small'} />
        </div>
      {/if}
      <span><Label label={filter.nested.key.label} /></span>
    </button>
    <button
      class="filter-button"
      on:click={() => {
        toggle(true)
      }}
    >
      {#await modeValuePromise then mode}
        {#if mode?.label}
          <span><Label label={mode.label} params={{ value: filter.value.length }} /></span>
        {/if}
      {/await}
    </button>
  {/if}
  {#await modeValuePromise then mode}
    {#if !(mode?.disableValueSelector ?? false)}
      <button
        class="filter-button"
        on:click={(e) => {
          showPopup(
            currentFilter.key.component,
            {
              _class: currentFilter.key._class,
              filter: currentFilter,
              onChange
            },
            eventToHTMLElement(e)
          )
        }}
      >
        <span>{countLabel}</span>
      </button>
    {/if}
  {/await}
  <button
    class="filter-button right-round"
    on:click={() => {
      dispatch('remove')
    }}
  >
    <div class="btn-icon"><Icon icon={IconClose} size={'small'} /></div>
  </button>
</div>

<style lang="scss">
  .filter-section {
    display: flex;
    align-items: center;
    margin-bottom: 0.375rem;

    &:not(:last-child) {
      margin-right: 0.375rem;
    }
  }

  .filter-button {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-right: 1px;
    padding: 0 0.375rem;
    font-size: 0.75rem;
    height: 1.5rem;
    min-width: 1.5rem;
    white-space: nowrap;
    color: var(--accent-color);
    background-color: var(--noborder-bg-color);
    border: 1px solid transparent;
    transition-property: border, background-color, color, box-shadow;
    transition-duration: 0.15s;

    .btn-icon {
      color: var(--content-color);
      transition: color 0.15s;
      pointer-events: none;
    }
    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 10rem;
    }
    &:hover {
      color: var(--caption-color);
      background-color: var(--noborder-bg-hover);

      .btn-icon {
        color: var(--caption-color);
      }
    }

    &.left-round {
      border-radius: 0.25rem 0 0 0.25rem;
    }
    &.right-round {
      border-radius: 0 0.25rem 0.25rem 0;
    }
    &:last-child {
      margin-right: 0;
    }
  }
</style>
