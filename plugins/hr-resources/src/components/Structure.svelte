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
  import contact from '@anticrm/contact'
  import { DocumentQuery, Ref, WithLookup } from '@anticrm/core'
  import type { Department, Staff } from '@anticrm/hr'
  import { createQuery } from '@anticrm/presentation'
  import { Button, eventToHTMLElement, Icon, IconAdd, Label, Scroller, SearchEdit, showPopup } from '@anticrm/ui'
  import hr from '../plugin'
  import CreateDepartment from './CreateDepartment.svelte'
  import DepartmentCard from './DepartmentCard.svelte'

  let search = ''
  let resultQuery: DocumentQuery<Department> = {}

  function updateResultQuery (search: string): void {
    resultQuery = search === '' ? {} : { $search: search }
  }

  function showCreateDialog (ev: MouseEvent) {
    showPopup(CreateDepartment, {}, eventToHTMLElement(ev))
  }

  const query = createQuery()
  const spaceMembers = createQuery()

  let descendants: Map<Ref<Department>, Department[]> = new Map<Ref<Department>, Department[]>()
  let allEmployees: WithLookup<Staff>[] = []
  let head: Department | undefined

  query.query(
    hr.class.Department,
    resultQuery,
    (res) => {
      head = res.find((p) => p._id === hr.ids.Head)
      descendants.clear()
      for (const doc of res) {
        const current = descendants.get(doc.space) ?? []
        current.push(doc)
        descendants.set(doc.space, current)
      }
      descendants = descendants
    },
    {
      lookup: {
        teamLead: contact.class.Employee
      }
    }
  )

  spaceMembers.query(hr.mixin.Staff, {}, (res) => {
    allEmployees = res
  })
</script>

<div class="ac-header full divide">
  <div class="ac-header__wrap-title">
    <div class="ac-header__icon"><Icon icon={hr.icon.Structure} size={'small'} /></div>
    <span class="ac-header__title"><Label label={hr.string.Structure} /></span>
  </div>

  <SearchEdit
    bind:value={search}
    on:change={() => {
      updateResultQuery(search)
    }}
  />
  <Button
    label={hr.string.CreateDepartmentLabel}
    icon={IconAdd}
    kind={'primary'}
    size={'small'}
    on:click={showCreateDialog}
  />
</div>

<Scroller>
  {#if head}
    <DepartmentCard value={head} {descendants} {allEmployees} />
  {/if}
</Scroller>
