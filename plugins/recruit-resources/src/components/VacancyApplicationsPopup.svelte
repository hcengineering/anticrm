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
  import core, { Doc, DocumentQuery, FindOptions, Ref, Space } from '@anticrm/core'
  import recruit, { Applicant } from '@anticrm/recruit'
  import task from '@anticrm/task'
  import { Table } from '@anticrm/view-resources'

  export let value: Ref<Space>
  export let resultQuery: DocumentQuery<Doc>

  const options: FindOptions<Applicant> = {
    lookup: {
      state: task.class.State,
      space: core.class.Space,
      doneState: task.class.DoneState,
      attachedTo: recruit.mixin.Candidate
    },
    limit: 10
  }
</script>

<div class="popup-table">
  <Table
    _class={recruit.class.Applicant}
    config={['', '$lookup.attachedTo', '$lookup.state', '$lookup.doneState', 'modifiedOn']}
    {options}
    query={{ ...(resultQuery ?? {}), space: value }}
    loadingProps={{ length: 0 }}
  />
</div>

<style lang="scss">
  .popup-table {
    overflow: auto;
    // width: 70rem;
    // max-width: 70rem !important;
    max-height: 30rem;
  }
</style>
