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
  import contact, { Employee, EmployeeAccount, formatName } from '@anticrm/contact'
  import { getCurrentAccount } from '@anticrm/core'
  import login from '@anticrm/login'
  import { setMetadata } from '@anticrm/platform'
  import { Avatar, createQuery } from '@anticrm/presentation'
  import setting, { SettingsCategory, settingId } from '@anticrm/setting'
  import {
    closePopup,
    fetchMetadataLocalStorage,
    getCurrentLocation,
    Icon,
    Label,
    navigate,
    setMetadataLocalStorage
  } from '@anticrm/ui'

  // const client = getClient()
  async function getItems (): Promise<SettingsCategory[]> {
    return []
  }

  const account = getCurrentAccount() as EmployeeAccount
  let employee: Employee | undefined
  const employeeQ = createQuery()

  employeeQ.query(
    contact.class.Employee,
    {
      _id: account.employee
    },
    (res) => {
      employee = res[0]
    },
    { limit: 1 }
  )

  function selectCategory (sp: SettingsCategory): void {
    closePopup()
    const loc = getCurrentLocation()
    loc.path[2] = settingId
    loc.path[3] = sp.name
    loc.path.length = 4
    navigate(loc)
  }

  function signOut (): void {
    const tokens = fetchMetadataLocalStorage(login.metadata.LoginTokens)
    if (tokens !== null) {
      const loc = getCurrentLocation()
      delete tokens[loc.path[1]]
      setMetadataLocalStorage(login.metadata.LoginTokens, tokens)
    }
    setMetadata(login.metadata.LoginToken, null)
    setMetadataLocalStorage(login.metadata.LoginEndpoint, null)
    setMetadataLocalStorage(login.metadata.LoginEmail, null)
    navigate({ path: [login.component.LoginApp] })
  }

  function selectWorkspace (): void {
    navigate({ path: [login.component.LoginApp, 'selectWorkspace'] })
  }

  function filterItems (items: SettingsCategory[]): SettingsCategory[] {
    return items?.filter((p) => p.name !== 'profile' && p.name !== 'password')
  }

  function editProfile (items: SettingsCategory[] | undefined): void {
    const profile = items?.find((p) => p.name === 'profile')
    if (profile === undefined) return
    selectCategory(profile)
  }
</script>

<div class="antiPopup">
  <div class="ap-space" />
  <div class="ap-scroll">
    <div class="ap-box">
      {#await getItems() then items}
        <div
          class="ap-menuItem flex-row-center"
          on:click={() => {
            editProfile(items)
          }}
        >
          {#if employee}
            <Avatar avatar={employee.avatar} size={'medium'} />
          {/if}
          <div class="ml-2 flex-col">
            {#if account}
              <div class="overflow-label fs-bold caption-color">{formatName(account.name)}</div>
              <div class="overflow-label text-sm content-dark-color">{account.email}</div>
            {/if}
          </div>
        </div>
        {#if items}
          {#each filterItems(items) as item}
            <button class="ap-menuItem" on:click={() => selectCategory(item)}>
              <div class="mr-2">
                <Icon icon={item.icon} size={'small'} />
              </div>
              <Label label={item.label} />
            </button>
          {/each}
        {/if}
        <button class="ap-menuItem" on:click={selectWorkspace}>
          <div class="mr-2">
            <Icon icon={setting.icon.SelectWorkspace} size={'small'} />
          </div>
          <Label label={setting.string.SelectWorkspace} />
        </button>
        <button class="ap-menuItem" on:click={signOut}>
          <div class="mr-2">
            <Icon icon={setting.icon.Signout} size={'small'} />
          </div>
          <Label label={setting.string.Signout} />
        </button>
      {/await}
    </div>
  </div>
  <div class="ap-space" />
</div>
