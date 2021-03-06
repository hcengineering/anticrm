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
  import type { Doc, Ref, Space } from '@anticrm/core'
  import core from '@anticrm/core'
  import notification from '@anticrm/notification'
  import { NotificationClientImpl } from '@anticrm/notification-resources'
  import { getResource, IntlString } from '@anticrm/platform'
  import preference from '@anticrm/preference'
  import { getClient } from '@anticrm/presentation'
  import { Action, IconEdit } from '@anticrm/ui'
  import view from '@anticrm/view'
  import { getActions as getContributedActions } from '@anticrm/view-resources'
  import { createEventDispatcher } from 'svelte'
  import { classIcon, getSpaceName } from '../../utils'
  import TreeItem from './TreeItem.svelte'
  import TreeNode from './TreeNode.svelte'

  export let label: IntlString
  export let currentSpace: Ref<Space> | undefined
  export let spaces: Space[]
  const client = getClient()
  const dispatch = createEventDispatcher()

  const unStarSpace: Action = {
    label: preference.string.Unstar,
    icon: preference.icon.Star,
    action: async (_id: Ref<Doc>): Promise<void> => {
      const current = await client.findOne(preference.class.SpacePreference, { attachedTo: _id as Ref<Space> })
      if (current !== undefined) {
        await client.remove(current)
      }
    }
  }

  const unStarAll: Action = {
    label: preference.string.DeleteStarred,
    icon: view.icon.Delete,
    action: async (): Promise<void> => {
      const ids = spaces.map((space) => space._id)
      const current = await client.findAll(preference.class.SpacePreference, { attachedTo: { $in: ids } })

      await Promise.all(
        current.map(async (item) => {
          await client.remove(item)
        })
      )
    }
  }

  function selectSpace (id: Ref<Space>, spaceSpecial?: string) {
    dispatch('space', { space: id, spaceSpecial })
  }

  async function getActions (space: Space): Promise<Action[]> {
    const result = [unStarSpace]

    const extraActions = await getContributedActions(client, space, core.class.Space)
    for (const act of extraActions) {
      result.push({
        icon: act.icon ?? IconEdit,
        label: act.label,
        action: async (evt: Event) => {
          const impl = await getResource(act.action)
          await impl(space, evt, act.actionProps)
        }
      })
    }
    return result
  }

  const notificationClient = NotificationClientImpl.getClient()
  const lastViews = notificationClient.getLastViews()
  const hierarchy = client.getHierarchy()

  function isChanged (space: Space, lastViews: Map<Ref<Doc>, number>): boolean {
    const clazz = hierarchy.getClass(space._class)
    const lastEditMixin = hierarchy.as(clazz, notification.mixin.SpaceLastEdit)
    const field = lastEditMixin?.lastEditField
    const lastView = lastViews.get(space._id)
    if (lastView === undefined || lastView === -1) return false
    if (field === undefined) return false
    const value = (space as any)[field]
    if (isNaN(value)) return false

    return lastView < value
  }
</script>

<TreeNode {label} parent actions={async () => [unStarAll]} indent={'ml-2'}>
  {#each spaces as space (space._id)}
    {#await getSpaceName(client, space) then name}
      <TreeItem
        indent={'ml-4'}
        _id={space._id}
        title={name}
        icon={classIcon(client, space._class)}
        selected={currentSpace === space._id}
        actions={() => getActions(space)}
        bold={isChanged(space, $lastViews)}
        on:click={() => {
          selectSpace(space._id)
        }}
      />
    {/await}
  {/each}
</TreeNode>
