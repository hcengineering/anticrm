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
  import type { Ref } from '@anticrm/core'
  import type { Customer } from '@anticrm/lead'
  import { Button, IconAdd, Label, showPopup } from '@anticrm/ui'
  import { Table } from '@anticrm/view-resources'
  import lead from '../plugin'
  import CreateLead from './CreateLead.svelte'

  export let objectId: Ref<Customer>
  export let leads: number | undefined = undefined
  $: loadingProps = leads !== undefined ? { length: leads } : undefined

  const createLead = (ev: MouseEvent): void => {
    showPopup(CreateLead, { candidate: objectId, preserveCandidate: true }, ev.target as HTMLElement)
  }
</script>

<div class="antiSection">
  <div class="antiSection-header">
    <span class="antiSection-header__title">
      <Label label={lead.string.Leads} />
    </span>
    <Button icon={IconAdd} kind={'transparent'} shape={'circle'} on:click={createLead} />
  </div>
  {#if leads !== undefined && leads > 0}
    <Table
      _class={lead.class.Lead}
      config={['', '$lookup.state', '$lookup.doneState']}
      query={{ attachedTo: objectId }}
      {loadingProps}
    />
  {:else}
    <div class="antiSection-empty solid flex-col-center mt-3">
      <span class="text-sm dark-color">
        <Label label={lead.string.NoLeadsForDocument} />
      </span>
      <span class="text-sm content-accent-color over-underline" on:click={createLead}>
        <Label label={lead.string.CreateLead} />
      </span>
    </div>
  {/if}
</div>
