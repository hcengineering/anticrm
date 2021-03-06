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
  import core, { Class, DocumentQuery, Ref, SortingOrder, Timestamp } from '@anticrm/core'
  import { createQuery, getClient } from '@anticrm/presentation'
  import type { DoneState, SpaceWithStates, State, Task } from '@anticrm/task'
  import task from '@anticrm/task'
  import { BarDashboard, DashboardItem } from '@anticrm/ui'
  import { FilterBar } from '@anticrm/view-resources'
  import CreateFilter from './CreateFilter.svelte'

  export let _class: Ref<Class<Task>>
  export let space: Ref<SpaceWithStates>

  const client = getClient()
  const hieararchy = client.getHierarchy()

  let states: State[] = []
  const statesQuery = createQuery()
  $: updateStates(space)

  function updateStates (space: Ref<SpaceWithStates>): void {
    statesQuery.query(
      task.class.State,
      { space },
      (result) => {
        states = result
      },
      {
        sort: {
          rank: SortingOrder.Ascending
        }
      }
    )
  }

  let wonStates: Set<Ref<DoneState>> = new Set<Ref<DoneState>>()
  const doneStatesQuery = createQuery()
  $: updateDoneStates(space)

  function updateDoneStates (space: Ref<SpaceWithStates>): void {
    doneStatesQuery.query(task.class.DoneState, { space }, (result) => {
      wonStates = new Set(result.filter((p) => hieararchy.isDerived(p._class, task.class.WonState)).map((p) => p._id))
    })
  }

  let modified: Timestamp | undefined = undefined
  let ids: Ref<Task>[] = []
  const txQuery = createQuery()

  function updateTxes (_class: Ref<Class<Task>>, space: Ref<SpaceWithStates>, modified: Timestamp | undefined): void {
    if (modified === undefined) {
      ids = []
      return
    }
    txQuery.query(
      core.class.TxCollectionCUD,
      {
        objectSpace: space,
        'tx._class': core.class.TxCreateDoc,
        'tx.objectClass': _class,
        modifiedOn: { $gte: modified }
      },
      (result) => {
        ids = result.map((p) => p.tx.objectId) as Ref<Task>[]
      }
    )
  }

  let items: DashboardItem[] = []

  $: updateTxes(_class, space, modified)

  const docQuery = createQuery()

  $: query = modified
    ? {
        space,
        _id: { $in: ids }
      }
    : { space }
  let resultQuery = {
    space
  }

  function updateDocs (_class: Ref<Class<Task>>, states: State[], query: DocumentQuery<Task>): void {
    if (states.length === 0) {
      return
    }
    docQuery.query(
      _class,
      query,
      (result) => {
        const template: Map<Ref<State>, DashboardItem> = new Map(
          states.map((p) => {
            return [
              p._id,
              {
                label: p.title,
                values: [
                  { color: 10, value: 0 },
                  { color: 0, value: 0 },
                  { color: 11, value: 0 }
                ]
              }
            ]
          })
        )
        for (const value of result) {
          const group = template.get(value.state)
          if (group === undefined) continue
          if (value.doneState === null) {
            group.values[0].value++
          } else {
            const won = wonStates.has(value.doneState)
            if (won === undefined) continue
            const index = won ? 1 : 2
            group.values[index].value++
          }
          template.set(value.state, group)
        }
        items = Array.from(template.values())
      },
      {
        projection: {
          state: 1,
          doneState: 1
        }
      }
    )
  }

  $: updateDocs(_class, states, resultQuery)
</script>

<CreateFilter bind:value={modified} />
<FilterBar {_class} {query} on:change={(e) => (resultQuery = e.detail)} />

<div class="ml-10 mt-4">
  <BarDashboard {items} />
</div>
