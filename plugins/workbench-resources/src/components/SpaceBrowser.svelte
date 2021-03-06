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
  import {
    Class,
    DocumentQuery,
    FindOptions,
    getCurrentAccount,
    Ref,
    SortingOrder,
    SortingQuery,
    Space
  } from '@anticrm/core'
  import {
    AnyComponent,
    Button,
    getCurrentLocation,
    Icon,
    Label,
    navigate,
    Scroller,
    SearchEdit,
    showPopup
  } from '@anticrm/ui'
  import presentation, { createQuery, getClient } from '@anticrm/presentation'
  import plugin from '../plugin'
  import { FilterBar, FilterButton, SpacePresenter } from '@anticrm/view-resources'
  import { IntlString } from '@anticrm/platform'
  import { classIcon } from '../utils'

  export let _class: Ref<Class<Space>>
  export let label: IntlString
  export let createItemDialog: AnyComponent | undefined
  export let createItemLabel: IntlString = presentation.string.Create
  export let withHeader: boolean = true
  export let withFilterButton: boolean = true

  const me = getCurrentAccount()._id
  const client = getClient()
  const spaceQuery = createQuery()
  export let search: string = ''
  const sort: SortingQuery<Space> = {
    name: SortingOrder.Ascending
  }
  let searchQuery: DocumentQuery<Space>
  let resultQuery: DocumentQuery<Space>

  let spaces: Space[] = []

  $: updateSearchQuery(search)
  $: update(sort, resultQuery)

  async function update (sort: SortingQuery<Space>, resultQuery: DocumentQuery<Space>): Promise<void> {
    const options: FindOptions<Space> = {
      sort
    }

    spaceQuery.query(
      _class,
      {
        ...resultQuery
      },
      (res) => {
        spaces = res.filter((p) => !p.private || p.members.includes(me))
      },
      options
    )
  }

  function updateSearchQuery (search: string): void {
    searchQuery = search.length ? { $search: search } : {}
  }

  function showCreateDialog (ev: Event) {
    showPopup(createItemDialog as AnyComponent, {}, 'middle')
  }

  async function join (space: Space): Promise<void> {
    if (space.members.includes(me)) return
    await client.update(space, {
      $push: {
        members: me
      }
    })
  }

  async function leave (space: Space): Promise<void> {
    if (!space.members.includes(me)) return
    await client.update(space, {
      $pull: {
        members: me
      }
    })
  }

  async function view (space: Space): Promise<void> {
    const loc = getCurrentLocation()
    loc.path[3] = space._id
    navigate(loc)
  }
</script>

{#if withHeader}
  <div class="ac-header full divide">
    <div class="ac-header__wrap-title">
      <span class="ac-header__title"><Label {label} /></span>
    </div>
    {#if createItemDialog}
      <Button label={createItemLabel} size={'small'} on:click={(ev) => showCreateDialog(ev)} />
    {/if}
  </div>
  <div class="ml-8 mr-8 mt-4 mb-4">
    <SearchEdit
      bind:value={search}
      on:change={(ev) => {
        updateSearchQuery(search)
        update(sort, resultQuery)
      }}
    />
  </div>
{/if}
{#if withFilterButton}
  <div class="ml-10 mt-4 mb-4">
    <FilterButton {_class} />
  </div>
{/if}
<FilterBar {_class} query={searchQuery} on:change={(e) => (resultQuery = e.detail)} />
<Scroller padding={'2.5rem'}>
  <div class="flex-col">
    {#each spaces as space (space._id)}
      {@const icon = classIcon(client, space._class)}
      {@const joined = space.members.includes(me)}
      <div class="divider" />
      <div class="item flex-between">
        <div>
          <div class="fs-title flex">
            {#if icon}
              <Icon {icon} size={'small'} />
            {/if}
            <SpacePresenter value={space} />
          </div>
          <div>
            {#if joined}
              <Label label={plugin.string.Joined} />
              &#183
            {/if}
            {space.members.length}
            &#183
            {space.description}
          </div>
        </div>
        <div class="tools flex">
          {#if joined}
            <Button size={'x-large'} label={plugin.string.Leave} on:click={() => leave(space)} />
          {:else}
            <div class="mr-2">
              <Button size={'x-large'} label={plugin.string.View} on:click={() => view(space)} />
            </div>
            <Button size={'x-large'} kind={'primary'} label={plugin.string.Join} on:click={() => join(space)} />
          {/if}
        </div>
      </div>
    {/each}
    {#if createItemDialog}
      <div class="flex-center mt-10">
        <Button size={'x-large'} kind={'primary'} label={createItemLabel} on:click={(ev) => showCreateDialog(ev)} />
      </div>
    {/if}
  </div>
</Scroller>

<style lang="scss">
  .divider {
    background-color: var(--theme-dialog-divider);
    height: 1px;
  }

  .item {
    color: var(--caption-color);
    cursor: pointer;
    padding: 1rem 0.75rem;

    &:hover,
    &:focus {
      background-color: var(--popup-bg-hover);

      .tools {
        visibility: visible;
      }
    }
    .tools {
      position: relative;
      visibility: hidden;
    }
  }
</style>
