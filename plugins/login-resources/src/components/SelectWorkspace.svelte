<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021, 2022 Hardcore Engineering Inc.
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
  import { OK, setMetadata, Severity, Status } from '@anticrm/platform'
  import {
    Button,
    fetchMetadataLocalStorage,
    getCurrentLocation,
    Label,
    Location,
    navigate,
    setMetadataLocalStorage
  } from '@anticrm/ui'
  import { workbenchId } from '@anticrm/workbench'
  import login from '../plugin'
  import { getWorkspaces, selectWorkspace, Workspace } from '../utils'
  import StatusControl from './StatusControl.svelte'

  export let navigateUrl: string | undefined = undefined

  let status = OK

  async function select (workspace: string) {
    status = new Status(Severity.INFO, login.status.ConnectingToServer, {})

    const [loginStatus, result] = await selectWorkspace(workspace)
    status = loginStatus

    if (result !== undefined) {
      setMetadata(login.metadata.LoginToken, result.token)
      const tokens: Record<string, string> = fetchMetadataLocalStorage(login.metadata.LoginTokens) ?? {}
      tokens[result.workspace] = result.token
      setMetadataLocalStorage(login.metadata.LoginTokens, tokens)
      setMetadataLocalStorage(login.metadata.LoginEndpoint, result.endpoint)
      setMetadataLocalStorage(login.metadata.LoginEmail, result.email)
      if (navigateUrl !== undefined) {
        const url = JSON.parse(decodeURIComponent(navigateUrl)) as Location
        if (url.path[1] === workspace) {
          navigate(url)
          return
        }
      }
      navigate({ path: [workbenchId, workspace] })
    }
  }

  async function _getWorkspaces (): Promise<Workspace[]> {
    try {
      return getWorkspaces()
    } catch (err: any) {
      setMetadataLocalStorage(login.metadata.LoginToken, null)
      setMetadataLocalStorage(login.metadata.LoginEndpoint, null)
      setMetadataLocalStorage(login.metadata.LoginEmail, null)
      changeAccount()
      throw err
    }
  }

  function createWorkspace (): void {
    const loc = getCurrentLocation()
    loc.path[1] = 'createWorkspace'
    loc.path.length = 2
    navigate(loc)
  }

  function changeAccount (): void {
    const loc = getCurrentLocation()
    loc.path[1] = 'login'
    loc.path.length = 2
    navigate(loc)
  }
</script>

<form class="container">
  <div class="grow-separator" />
  <div class="title"><Label label={login.string.SelectWorkspace} /></div>
  <div class="status">
    <StatusControl {status} />
  </div>
  {#await _getWorkspaces() then workspaces}
    <div class="form">
      {#each workspaces as workspace}
        <div
          class="workspace flex-center fs-title cursor-pointer focused-button form-row"
          on:click={() => select(workspace.workspace)}
        >
          {workspace.workspace}
        </div>
      {/each}
      {#if !workspaces.length}
        <div class="form-row send">
          <Button label={login.string.CreateWorkspace} kind={'primary'} width="100%" on:click={createWorkspace} />
        </div>
      {/if}
    </div>
    <div class="grow-separator" />
    <div class="footer">
      {#if workspaces.length}
        <div>
          <span><Label label={login.string.WantAnotherWorkspace} /></span>
          <a href="." on:click|preventDefault={createWorkspace}><Label label={login.string.CreateWorkspace} /></a>
        </div>
      {/if}
      <div>
        <span><Label label={login.string.NotSeeingWorkspace} /></span>
        <a href="." on:click|preventDefault={changeAccount}><Label label={login.string.ChangeAccount} /></a>
      </div>
    </div>
  {/await}
</form>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    height: 100%;
    padding: 5rem;

    .title {
      font-weight: 600;
      font-size: 1.5rem;
      color: var(--theme-caption-color);
    }
    .status {
      min-height: 7.5rem;
      max-height: 7.5rem;
      padding-top: 1.25rem;
    }

    .form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 0.75rem;
      row-gap: 1.5rem;

      .form-row {
        grid-column-start: 1;
        grid-column-end: 3;
      }

      .workspace {
        padding: 1rem;
        border-radius: 1rem;
      }
    }
    .grow-separator {
      flex-grow: 1;
    }
    .footer {
      margin-top: 3.5rem;
      font-size: 0.8rem;
      color: var(--theme-caption-color);
      span {
        opacity: 0.3;
      }
      a {
        text-decoration: none;
        color: var(--theme-caption-color);
        opacity: 0.8;
        &:hover {
          opacity: 1;
        }
      }
    }
  }
</style>
