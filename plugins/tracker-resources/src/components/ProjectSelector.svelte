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
  import { Ref, SortingOrder } from '@anticrm/core'
  import { getEmbeddedLabel, IntlString, translate } from '@anticrm/platform'
  import { createQuery } from '@anticrm/presentation'
  import { Project } from '@anticrm/tracker'
  import type { ButtonKind, ButtonSize } from '@anticrm/ui'
  import { Button, ButtonShape, eventToHTMLElement, SelectPopup, showPopup } from '@anticrm/ui'
  import tracker from '../plugin'

  export let value: Ref<Project> | null | undefined
  export let shouldShowLabel: boolean = true
  export let isEditable: boolean = true
  export let onProjectIdChange: ((newProjectId: Ref<Project> | undefined) => void) | undefined = undefined
  export let popupPlaceholder: IntlString = tracker.string.AddToProject
  export let kind: ButtonKind = 'no-border'
  export let size: ButtonSize = 'small'
  export let shape: ButtonShape = undefined
  export let justify: 'left' | 'center' = 'center'
  export let width: string | undefined = 'min-content'
  export let onlyIcon: boolean = false

  let selectedProject: Project | undefined
  let defaultProjectLabel = ''

  const query = createQuery()
  let rawProjects: Project[] = []
  query.query(
    tracker.class.Project,
    {},
    (res) => {
      rawProjects = res
    },
    {
      sort: { modifiedOn: SortingOrder.Ascending }
    }
  )

  $: handleSelectedProjectIdUpdated(value, rawProjects)

  $: translate(tracker.string.Project, {}).then((result) => (defaultProjectLabel = result))
  $: projectIcon = selectedProject?.icon ?? tracker.icon.Projects
  $: projectText = shouldShowLabel ? selectedProject?.label ?? defaultProjectLabel : undefined

  const handleSelectedProjectIdUpdated = async (newProjectId: Ref<Project> | null | undefined, projects: Project[]) => {
    if (newProjectId === null || newProjectId === undefined) {
      selectedProject = undefined

      return
    }

    selectedProject = projects.find((it) => it._id === newProjectId)
  }

  const handleProjectEditorOpened = async (event: MouseEvent): Promise<void> => {
    event.stopPropagation()
    if (!isEditable) {
      return
    }

    const projectsInfo = [
      { id: null, icon: tracker.icon.Projects, label: tracker.string.NoProject },
      ...rawProjects.map((p) => ({
        id: p._id,
        icon: p.icon,
        text: p.label
      }))
    ]

    showPopup(
      SelectPopup,
      { value: projectsInfo, placeholder: popupPlaceholder, searchable: true },
      eventToHTMLElement(event),
      onProjectIdChange
    )
  }
</script>

<Button
  {kind}
  {size}
  {shape}
  {width}
  {justify}
  label={onlyIcon || projectText === undefined ? undefined : getEmbeddedLabel(projectText)}
  icon={projectIcon}
  disabled={!isEditable}
  on:click={handleProjectEditorOpened}
/>
