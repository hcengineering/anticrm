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
  import { Doc, DocumentQuery, Ref } from '@anticrm/core'
  import { Vacancy } from '@anticrm/recruit'
  import { Icon, tooltip } from '@anticrm/ui'
  import recruit from '../plugin'
  import VacancyApplicationsPopup from './VacancyApplicationsPopup.svelte'

  export let value: Vacancy
  export let applications: Map<Ref<Vacancy>, { count: number; modifiedOn: number }> | undefined
  export let resultQuery: DocumentQuery<Doc>

  $: count = applications?.get(value._id)?.count ?? 0
</script>

{#if value && count > 0}
  <div
    class="sm-tool-icon"
    use:tooltip={{
      label: recruit.string.Applications,
      component: VacancyApplicationsPopup,
      props: { value: value._id, resultQuery }
    }}
  >
    <div class="icon">
      <Icon icon={recruit.icon.Application} size={'small'} />
    </div>
    &nbsp;
    {applications?.get(value._id)?.count ?? 0}
  </div>
{/if}
