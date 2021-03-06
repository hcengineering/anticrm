<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
  import core, { Class, Doc, Ref, Space, WithLookup } from '@anticrm/core'
  import { IntlString } from '@anticrm/platform'
  import { getClient } from '@anticrm/presentation'
  import { AnyComponent, Component } from '@anticrm/ui'
  import view, { Viewlet } from '@anticrm/view'
  import type { ViewConfiguration } from '@anticrm/workbench'
  import SpaceContent from './SpaceContent.svelte'
  import SpaceHeader from './SpaceHeader.svelte'

  export let currentSpace: Ref<Space> | undefined
  export let currentView: ViewConfiguration | undefined
  export let createItemDialog: AnyComponent | undefined
  export let createItemLabel: IntlString | undefined

  let search: string = ''
  let viewlet: WithLookup<Viewlet> | undefined = undefined
  let space: Space | undefined
  let _class: Ref<Class<Doc>> | undefined = undefined
  let header: AnyComponent | undefined

  const client = getClient()

  let viewlets: WithLookup<Viewlet>[] = []

  $: update(currentSpace, currentView?.class)

  async function update (currentSpace?: Ref<Space>, attachTo?: Ref<Class<Doc>>): Promise<void> {
    if (currentSpace === undefined) {
      space = undefined
      return
    }
    space = await client.findOne(core.class.Space, { _id: currentSpace })
    if (space === undefined) {
      header = undefined
    } else {
      header = await getHeader(space._class)
    }
    if (attachTo) {
      viewlets = await client.findAll(
        view.class.Viewlet,
        { attachTo },
        {
          lookup: {
            descriptor: view.class.ViewletDescriptor
          }
        }
      )
      if (header !== undefined) {
        viewlet = viewlets[0]
      }
      _class = attachTo
    }
  }

  const hierarchy = client.getHierarchy()
  async function getHeader (_class: Ref<Class<Space>>): Promise<AnyComponent | undefined> {
    const clazz = hierarchy.getClass(_class)
    const headerMixin = hierarchy.as(clazz, view.mixin.SpaceHeader)
    if (headerMixin?.header == null && clazz.extends != null) return getHeader(clazz.extends)
    return headerMixin.header
  }
  function setViewlet (e: CustomEvent<WithLookup<Viewlet>>) {
    viewlet = e.detail
  }
</script>

{#if _class && space}
  {#if header}
    <Component
      is={header}
      props={{ spaceId: space._id, viewlets, viewlet, createItemDialog, createItemLabel }}
      on:change={setViewlet}
    />
  {:else}
    <SpaceHeader
      spaceId={space._id}
      {_class}
      {viewlets}
      {createItemDialog}
      {createItemLabel}
      bind:search
      bind:viewlet
    />
  {/if}
  <SpaceContent space={space._id} {_class} bind:search {viewlet} />
{/if}
