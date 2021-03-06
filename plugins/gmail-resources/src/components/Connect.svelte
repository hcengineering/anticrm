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
  import { getMetadata } from '@anticrm/platform'
  import { Button, IconClose, Label } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import login from '@anticrm/login'
  import gmail from '../plugin'

  const dispatch = createEventDispatcher()

  let connecting = false
  const gmailUrl = getMetadata(login.metadata.GmailUrl) ?? ''

  async function sendRequest (): Promise<void> {
    connecting = true
    const url = new URL(gmailUrl + '/signin')
    url.search = new URLSearchParams({
      redirectURL: window.location.href
    }).toString()

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + getMetadata(login.metadata.LoginToken),
        'Content-Type': 'application/json'
      }
    })
    const redirectTo = await res.text()
    window.open(redirectTo, '_self')
  }
</script>

<div class="card">
  <div class="flex-between header">
    <div class="overflow-label fs-title"><Label label={gmail.string.ConnectGmai} /></div>
    <div
      class="tool"
      on:click={() => {
        dispatch('close')
      }}
    >
      <IconClose size={'small'} />
    </div>
  </div>
  <div class="content">
    <Label label={gmail.string.RedirectGoogle} />
    <div class="footer">
      <Button label={gmail.string.Connect} kind={'primary'} disabled={connecting} on:click={sendRequest} />
    </div>
  </div>
</div>

<style lang="scss">
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 20rem;
    min-width: 20rem;
    max-width: 20rem;
    background-color: var(--theme-tooltip-color);
    border: 1px solid var(--theme-bg-accent-color);
    border-radius: 0.75rem;
    box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.2);

    .header {
      flex-shrink: 0;
      margin: 1.75rem 1.75rem 1.25rem;

      .tool {
        cursor: pointer;
        &:hover {
          color: var(--theme-caption-color);
        }
        &:active {
          color: var(--theme-content-accent-color);
        }
      }
    }

    .content {
      flex-shrink: 0;
      flex-grow: 1;
      height: fit-content;
      margin: 0 1.75rem 0.5rem;
    }

    .footer {
      display: flex;
      flex-direction: row-reverse;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
    }
  }
</style>
