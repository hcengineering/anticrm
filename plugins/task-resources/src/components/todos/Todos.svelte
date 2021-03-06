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
  import type { Ref, Space, Doc, Class } from '@anticrm/core'
  import type { TodoItem } from '@anticrm/task'
  import { createQuery } from '@anticrm/presentation'
  import { Button, IconAdd, showPopup, Label } from '@anticrm/ui'
  import CreateTodo from './CreateTodo.svelte'
  import { Table } from '@anticrm/view-resources'

  import task from '@anticrm/task'
  import plugin from '../../plugin'

  export let objectId: Ref<Doc>
  export let space: Ref<Space>
  export let _class: Ref<Class<Doc>>

  let todos: TodoItem[] = []

  const query = createQuery()
  $: query.query(task.class.TodoItem, { attachedTo: objectId }, (result) => {
    todos = result
  })

  const createApp = (ev: MouseEvent): void => {
    showPopup(CreateTodo, { objectId, _class, space }, ev.target as HTMLElement)
  }
</script>

<div class="antiSection">
  <div class="antiSection-header">
    <span class="antiSection-header__title">
      <Label label={plugin.string.Todos} />
    </span>
    <Button icon={IconAdd} kind={'transparent'} shape={'circle'} on:click={createApp} />
  </div>
  {#if todos.length > 0}
    <Table
      _class={task.class.TodoItem}
      config={[
        { key: '', label: plugin.string.TodoName },
        'dueTo',
        { key: 'done', presenter: plugin.component.TodoStatePresenter, label: plugin.string.TodoState }
      ]}
      options={{
        sort: {
          rank: 1
        }
      }}
      query={{ attachedTo: objectId }}
    />
  {:else}
    <div class="antiSection-empty solid flex-col-center mt-3">
      <span class="text-sm over-underline" on:click={createApp}>
        <Label label={plugin.string.NoTodoItems} />
      </span>
    </div>
  {/if}
</div>
