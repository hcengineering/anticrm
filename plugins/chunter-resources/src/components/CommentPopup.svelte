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
  import { Ref, Doc, SortingOrder } from '@anticrm/core'

  import chunter, { Comment } from '@anticrm/chunter'
  import { createQuery } from '@anticrm/presentation'
  import CommentPresenter from './CommentPresenter.svelte'

  export let objectId: Ref<Doc>

  let comments: Comment[] = []
  const query = createQuery()
  $: query.query(
    chunter.class.Comment,
    { attachedTo: objectId },
    (res) => {
      comments = res
    },
    { limit: 3, sort: { modifiedOn: SortingOrder.Descending } }
  )
</script>

{#each comments as comment}
  <div class="item">
    <CommentPresenter value={comment} />
  </div>
{/each}

<style lang="scss">
  .item {
    max-width: 30rem;
  }
  .item + .item {
    margin-top: 1.25rem;
  }
</style>
