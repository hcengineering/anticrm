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
  import { EmployeeAccount } from '@anticrm/contact'
  import { AccountRole, getCurrentAccount } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import setting, { SettingsCategory } from '@anticrm/setting'
  import ui, { Button, Component, getCurrentLocation, IconBack, Label, location, navigate } from '@anticrm/ui'
  import { onDestroy } from 'svelte'
  import CategoryElement from './CategoryElement.svelte'

  let category: SettingsCategory | undefined
  let categoryId: string = ''

  let categories: SettingsCategory[] = []
  const account = getCurrentAccount() as EmployeeAccount

  export let visibileNav = true
  export let onFirstCategory: () => void

  const settingsQuery = createQuery()
  settingsQuery.query(
    setting.class.WorkspaceSettingCategory,
    {},
    (res) => {
      categories = account.role > AccountRole.User ? res : res.filter((p) => p.secured === false)
      category = findCategory(categoryId)
    },
    { sort: { order: 1 } }
  )

  function findCategory (name: string): SettingsCategory | undefined {
    return categories.find((x) => x.name === name)
  }

  onDestroy(
    location.subscribe(async (loc) => {
      categoryId = loc.path[4]
      category = findCategory(categoryId)
    })
  )

  function selectCategory (id: string): void {
    const loc = getCurrentLocation()
    loc.path[4] = id
    loc.path.length = 5
    navigate(loc)
  }
</script>

<div class="flex h-full">
  {#if visibileNav}
    <div class="antiPanel-navigator filled indent">
      <div class="antiNav-header">
        <div class="flex-row-center gap-2">
          <Button
            kind={'link'}
            icon={IconBack}
            label={ui.string.Back}
            on:click={() => onFirstCategory()}
            size={'small'}
          />
          <span class="fs-title overflow-label">
            <Label label={setting.string.WorkspaceSetting} />
          </span>
        </div>
      </div>
      {#each categories as category}
        <CategoryElement
          icon={category.icon}
          label={category.label}
          selected={category.name === categoryId}
          on:click={() => {
            selectCategory(category.name)
          }}
        />
      {/each}
    </div>
  {/if}

  <div class="antiPanel-component border-left filled">
    {#if category}
      <Component is={category.component} />
    {/if}
  </div>
</div>
