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
  import type { Doc, Ref } from '@anticrm/core'
  import { Button, IconAdd, Label, showPopup } from '@anticrm/ui'
  import { Table } from '@anticrm/view-resources'
  import recruit from '../../plugin'
  import FileDuo from '../icons/FileDuo.svelte'
  import CreateOpinion from './CreateOpinion.svelte'

  export let objectId: Ref<Doc>

  export let opinions: number

  const createApp = (ev: MouseEvent): void => {
    showPopup(CreateOpinion, { review: objectId }, ev.target as HTMLElement)
  }
</script>

<div class="antiSection">
  <div class="antiSection-header">
    <span class="antiSection-header__title">
      <Label label={recruit.string.Opinions} />
    </span>
    <Button icon={IconAdd} kind={'transparent'} shape={'circle'} on:click={createApp} />
  </div>
  {#if opinions > 0}
    <Table
      _class={recruit.class.Opinion}
      config={['', 'value', 'description', '$lookup.modifiedBy']}
      query={{ attachedTo: objectId }}
      loadingProps={{ length: opinions }}
    />
  {:else}
    <div class="antiSection-empty solid flex-col-center mt-3">
      <div class="content-accent-color">
        <FileDuo size={'large'} />
      </div>
      <div class="text-sm dark-color mt-2">
        <Label label={recruit.string.NoReviewForCandidate} />
      </div>
      <span class="text-sm content-accent-color over-underline" on:click={createApp}>
        <Label label={recruit.string.CreateAnReview} />
      </span>
    </div>
  {/if}
</div>
