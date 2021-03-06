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
  import type { Class, Doc, DocumentQuery, FindOptions, Lookup, Ref } from '@anticrm/core'
  import { getObjectValue, SortingOrder } from '@anticrm/core'
  import notification from '@anticrm/notification'
  import { createQuery, getClient } from '@anticrm/presentation'
  import { CheckBox, Component, IconDown, IconUp, Label, Loading, showPopup, Spinner } from '@anticrm/ui'
  import { BuildModelKey } from '@anticrm/view'
  import { createEventDispatcher } from 'svelte'
  import { buildConfigLookup, buildModel, LoadingProps } from '../utils'
  import Menu from './Menu.svelte'

  export let _class: Ref<Class<Doc>>
  export let query: DocumentQuery<Doc>
  export let enableChecking: boolean = false
  export let showNotification: boolean = false
  export let highlightRows: boolean = false
  export let hiddenHeader: boolean = false
  export let options: FindOptions<Doc> | undefined = undefined
  export let baseMenuClass: Ref<Class<Doc>> | undefined = undefined
  export let config: (BuildModelKey | string)[]
  export let tableId: string | undefined = undefined

  // If defined, will show a number of dummy items before real data will appear.
  export let loadingProps: LoadingProps | undefined = undefined

  export let selection: number | undefined = undefined
  export let checked: Doc[] = []

  const client = getClient()
  const hierarchy = client.getHierarchy()

  $: lookup = options?.lookup ?? buildConfigLookup(hierarchy, _class, config)

  let sortKey = 'modifiedOn'
  let sortOrder = SortingOrder.Descending
  let loading = 0

  let objects: Doc[] = []
  const refs: HTMLElement[] = []

  $: refs.length = objects.length

  const q = createQuery()

  const dispatch = createEventDispatcher()

  $: sortingFunction = (config.find((it) => typeof it !== 'string' && it.sortingKey === sortKey) as BuildModelKey)
    ?.sortingFunction

  async function update (
    _class: Ref<Class<Doc>>,
    query: DocumentQuery<Doc>,
    sortKey: string | string[],
    sortOrder: SortingOrder,
    lookup: Lookup<Doc>,
    options?: FindOptions<Doc>
  ) {
    const sort = Array.isArray(sortKey)
      ? sortKey.reduce((acc: Record<string, SortingOrder>, val) => {
        acc[val] = sortOrder
        return acc
      }, {})
      : { [sortKey]: sortOrder }
    const update = q.query(
      _class,
      query,
      (result) => {
        objects = result
        if (sortingFunction !== undefined) {
          const sf = sortingFunction
          objects.sort((a, b) => -1 * sortOrder * sf(a, b))
        }
        dispatch('content', objects)
        loading = loading === 1 ? 0 : -1
      },
      { sort, limit: 200, lookup, ...options }
    )
    if (update && ++loading > 0) {
      objects = []
    }
  }
  $: update(_class, query, sortKey, sortOrder, lookup, options)

  const showMenu = async (ev: MouseEvent, object: Doc, row: number): Promise<void> => {
    selection = row
    if (!checkedSet.has(object._id)) {
      check(objects, false)
      checked = []
    }
    const items = checked.length > 0 ? checked : object
    showPopup(
      Menu,
      { object: items, baseMenuClass },
      {
        getBoundingClientRect: () => DOMRect.fromRect({ width: 1, height: 1, x: ev.clientX, y: ev.clientY })
      },
      () => {
        selection = undefined
      }
    )
  }

  function changeSorting (key: string): void {
    if (key === '') {
      return
    }
    if (key !== sortKey) {
      sortKey = key
      sortOrder = SortingOrder.Ascending
    } else {
      sortOrder = sortOrder === SortingOrder.Ascending ? SortingOrder.Descending : SortingOrder.Ascending
    }
  }

  $: checkedSet = new Set<Ref<Doc>>(checked.map((it) => it._id))

  export function check (docs: Doc[], value: boolean) {
    if (!enableChecking) return
    dispatch('check', { docs, value })
  }

  function getLoadingLength (props: LoadingProps, options?: FindOptions<Doc>): number {
    if (options?.limit !== undefined && options?.limit > 0) {
      return Math.min(options?.limit, props.length)
    }
    return props.length
  }
  function onRow (object: Doc): void {
    dispatch('row-focus', object)
  }

  export function select (offset: 1 | -1 | 0, of?: Doc): void {
    let pos = (of !== undefined ? objects.findIndex((it) => it._id === of._id) : selection) ?? -1
    pos += offset
    if (pos < 0) {
      pos = 0
    }
    if (pos >= objects.length) {
      pos = objects.length - 1
    }
    const r = refs[pos]
    selection = pos
    onRow(objects[pos])
    if (r !== undefined) {
      r?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }
  }

  const joinProps = (collectionAttr: boolean, object: Doc, props: any) => {
    if (collectionAttr) {
      return { object, ...props }
    }
    return props
  }
</script>

{#await buildModel({ client, _class, keys: config, lookup })}
  <Loading />
{:then model}
  <table id={tableId} class="antiTable" class:metaColumn={enableChecking || showNotification} class:highlightRows>
    {#if !hiddenHeader}
      <thead class="scroller-thead">
        <tr class="scroller-thead__tr">
          {#if enableChecking || showNotification}
            <th>
              {#if enableChecking && objects?.length > 0}
                <div class="antiTable-cells__checkCell" class:checkall={checkedSet.size > 0}>
                  <CheckBox
                    symbol={'minus'}
                    checked={objects?.length === checkedSet.size && objects?.length > 0}
                    on:value={(event) => {
                      check(objects, event.detail)
                    }}
                  />
                </div>
              {/if}
            </th>
          {/if}
          {#each model as attribute}
            <th
              class:sortable={attribute.sortingKey}
              class:sorted={attribute.sortingKey === sortKey}
              on:click={() => changeSorting(attribute.sortingKey)}
            >
              <div class="antiTable-cells">
                <Label label={attribute.label} />
                {#if attribute.sortingKey === sortKey}
                  <div class="icon">
                    {#if sortOrder === SortingOrder.Ascending}
                      <IconUp size={'small'} />
                    {:else}
                      <IconDown size={'small'} />
                    {/if}
                  </div>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
    {/if}
    {#if objects.length}
      <tbody>
        {#each objects as object, row (object._id)}
          <tr
            class="antiTable-body__row"
            class:checking={checkedSet.has(object._id)}
            class:fixed={row === selection}
            class:selected={row === selection}
            on:mouseover={() => onRow(object)}
            on:focus={() => {}}
            bind:this={refs[row]}
            on:contextmenu|preventDefault={(ev) => showMenu(ev, object, row)}
          >
            {#each model as attribute, cell}
              {#if !cell}
                {#if enableChecking || showNotification}
                  <td class="relative">
                    {#if showNotification}
                      <div class="antiTable-cells__notifyCell">
                        {#if enableChecking}
                          <div class="antiTable-cells__checkCell">
                            <CheckBox
                              checked={checkedSet.has(object._id)}
                              on:value={(event) => {
                                check([object], event.detail)
                              }}
                            />
                          </div>
                        {/if}
                        <Component
                          is={notification.component.NotificationPresenter}
                          props={{ value: object, kind: enableChecking ? 'table' : 'block' }}
                        />
                      </div>
                    {:else}
                      <div class="antiTable-cells__checkCell">
                        <CheckBox
                          checked={checkedSet.has(object._id)}
                          on:value={(event) => {
                            check([object], event.detail)
                          }}
                        />
                      </div>
                    {/if}
                  </td>
                {/if}
                <td>
                  <div class="antiTable-cells__firstCell">
                    <svelte:component
                      this={attribute.presenter}
                      value={getObjectValue(attribute.key, object) ?? ''}
                      {...joinProps(attribute.collectionAttr, object, attribute.props)}
                    />
                    <!-- <div
                      id="context-menu"
                      class="antiTable-cells__firstCell-menuRow"
                      on:click={(ev) => showMenu(ev, object, row)}
                    >
                      <MoreV size={'small'} />
                    </div> -->
                  </div>
                </td>
              {:else}
                <td>
                  <svelte:component
                    this={attribute.presenter}
                    value={getObjectValue(attribute.key, object) ?? ''}
                    {...joinProps(attribute.collectionAttr, object, attribute.props)}
                  />
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    {:else if loadingProps !== undefined}
      <tbody>
        {#each Array(getLoadingLength(loadingProps, options)) as i, row}
          <tr class="antiTable-body__row" class:fixed={row === selection}>
            {#each model as attribute, cell}
              {#if !cell}
                {#if enableChecking}
                  <td>
                    <div class="antiTable-cells__checkCell">
                      <CheckBox checked={false} />
                    </div>
                  </td>
                {/if}
                <td id={`loader-${i}-${attribute.key}`}>
                  <Spinner size="small" />
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    {/if}
  </table>
  {#if loading > 0}<Loading />{/if}
{/await}
