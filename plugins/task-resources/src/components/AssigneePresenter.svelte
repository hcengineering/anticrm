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
  import contact, { Employee } from '@anticrm/contact'
  import { Class, Doc, Ref, Space } from '@anticrm/core'
  import { Task } from '@anticrm/task'
  import { UsersPopup, getClient } from '@anticrm/presentation'
  import { AttributeModel } from '@anticrm/view'
  import { eventToHTMLElement, showPopup } from '@anticrm/ui'
  import { getObjectPresenter } from '@anticrm/view-resources'
  import { IntlString } from '@anticrm/platform'
  import task from '../plugin'

  export let value: Employee | null | undefined
  export let issueId: Ref<Task>
  export let defaultClass: Ref<Class<Doc>> | undefined = undefined
  export let currentSpace: Ref<Space> | undefined = undefined
  export let isEditable: boolean = true
  export let shouldShowLabel: boolean = false
  export let defaultName: IntlString | undefined = undefined

  const client = getClient()

  let presenter: AttributeModel | undefined

  $: if (value || defaultClass) {
    if (value) {
      getObjectPresenter(client, value._class, { key: '' }).then((p) => {
        presenter = p
      })
    } else if (defaultClass) {
      getObjectPresenter(client, defaultClass, { key: '' }).then((p) => {
        presenter = p
      })
    }
  }

  const handleAssigneeChanged = async (result: Employee | null | undefined) => {
    if (!isEditable || result === undefined) {
      return
    }

    const currentIssue = await client.findOne(task.class.Task, { space: currentSpace, _id: issueId })

    if (currentIssue === undefined) {
      return
    }

    const newAssignee = result === null ? null : result._id

    await client.updateCollection(
      currentIssue._class,
      currentIssue.space,
      currentIssue._id,
      currentIssue.attachedTo,
      currentIssue.attachedToClass,
      currentIssue.collection,
      { assignee: newAssignee }
    )
  }

  const handleAssigneeEditorOpened = async (event: MouseEvent) => {
    if (!isEditable) {
      return
    }
    event?.preventDefault()
    event?.stopPropagation()

    showPopup(
      UsersPopup,
      {
        _class: contact.class.Employee,
        selected: value?._id,
        docQuery: {
          active: true
        },
        allowDeselect: true,
        placeholder: task.string.AssignThisTask
      },
      eventToHTMLElement(event),
      handleAssigneeChanged
    )
  }
</script>

{#if presenter}
  <svelte:component
    this={presenter.presenter}
    {value}
    {defaultName}
    avatarSize={'x-small'}
    isInteractive={true}
    shouldShowPlaceholder={true}
    shouldShowName={shouldShowLabel}
    onEmployeeEdit={handleAssigneeEditorOpened}
    tooltipLabels={{ personLabel: task.string.TaskAssignee, placeholderLabel: task.string.TaskUnAssign }}
  />
{/if}
