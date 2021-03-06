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
  import type { Class, Doc, Ref, Space } from '@anticrm/core'
  import core, { WithLookup } from '@anticrm/core'
  import { IntlString } from '@anticrm/platform'
  import presentation, { createQuery, getClient } from '@anticrm/presentation'
  import { AnyComponent, Button, IconAdd, SearchEdit, showPanel, showPopup, TabList } from '@anticrm/ui'
  import view, { Viewlet } from '@anticrm/view'
  import { ViewletSettingButton } from '@anticrm/view-resources'
  import { createEventDispatcher } from 'svelte'
  import plugin from '../plugin'
  import { classIcon } from '../utils'
  import Header from './Header.svelte'

  export let spaceId: Ref<Space> | undefined
  export let createItemDialog: AnyComponent | undefined
  export let createItemLabel: IntlString = presentation.string.Create
  export let search: string
  export let viewlet: WithLookup<Viewlet> | undefined
  export let viewlets: WithLookup<Viewlet>[] = []
  export let _class: Ref<Class<Doc>> | undefined = undefined

  const client = getClient()
  const hierarchy = client.getHierarchy()
  const query = createQuery()
  let space: Space | undefined
  const dispatch = createEventDispatcher()

  const prevSpaceId = spaceId

  $: query.query(core.class.Space, { _id: spaceId }, (result) => {
    space = result[0]
  })

  function showCreateDialog (ev: Event) {
    showPopup(createItemDialog as AnyComponent, { space: spaceId }, 'top')
  }

  $: updateViewlets(viewlets)

  $: if (prevSpaceId !== spaceId) {
    search = ''
    dispatch('search', '')
  }

  async function getEditor (_class: Ref<Class<Doc>>): Promise<AnyComponent | undefined> {
    const clazz = hierarchy.getClass(_class)
    const editorMixin = hierarchy.as(clazz, view.mixin.ObjectEditor)
    if (editorMixin?.editor == null && clazz.extends != null) return getEditor(clazz.extends)
    return editorMixin.editor
  }

  async function onSpaceEdit (): Promise<void> {
    if (space === undefined) return
    const editor = await getEditor(space._class)
    showPanel(editor ?? plugin.component.SpacePanel, space._id, space._class, 'content')
  }

  function updateViewlets (viewlets: WithLookup<Viewlet>[]) {
    const index = viewlets.findIndex((p) => p.descriptor === viewlet?.descriptor)
    viewlet = index === -1 ? viewlets[0] : viewlets[index]
  }
  $: viewslist = viewlets.map((views) => {
    return {
      id: views._id,
      icon: views.$lookup?.descriptor?.icon,
      tooltip: views.$lookup?.descriptor?.label
    }
  })
</script>

<div class="ac-header full withSettings">
  {#if space}
    <Header
      icon={classIcon(client, space._class)}
      label={space.name}
      description={space.description}
      {_class}
      on:click={onSpaceEdit}
    />
    <SearchEdit
      bind:value={search}
      on:change={() => {
        dispatch('search', search)
      }}
    />
    {#if createItemDialog}
      <Button
        icon={IconAdd}
        label={createItemLabel}
        kind={'primary'}
        size={'small'}
        on:click={(ev) => showCreateDialog(ev)}
      />
    {/if}
    {#if viewlets.length > 1}
      <TabList
        items={viewslist}
        multiselect={false}
        selected={viewlet?._id}
        kind={'secondary'}
        size={'small'}
        on:select={(result) => {
          if (result.detail !== undefined) viewlet = viewlets.find((vl) => vl._id === result.detail.id)
        }}
      />
    {/if}
    <ViewletSettingButton {viewlet} />
  {/if}
</div>
