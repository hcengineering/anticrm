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
  import { Organization } from '@anticrm/contact'
  import { Ref } from '@anticrm/core'
  import { IntlString } from '@anticrm/platform'
  import { createQuery } from '@anticrm/presentation'
  import type { ButtonKind, ButtonSize, TooltipAlignment } from '@anticrm/ui'
  import { Dropdown } from '@anticrm/ui'
  import { ListItem } from '@anticrm/ui/src/types'
  import { createEventDispatcher } from 'svelte'
  import contact from '../plugin'
  import Company from './icons/Company.svelte'

  export let value: Ref<Organization> | undefined
  export let label: IntlString = contact.string.Organization

  export let kind: ButtonKind = 'no-border'
  export let size: ButtonSize = 'small'
  export let justify: 'left' | 'center' = 'center'
  export let width: string | undefined = undefined
  export let labelDirection: TooltipAlignment | undefined = undefined
  export let focusIndex = -1

  const query = createQuery()
  const dispatch = createEventDispatcher()

  let items: ListItem[] = []
  let selected: ListItem | undefined
  let resolved = false

  query.query(contact.class.Organization, {}, (res) => {
    items = res.map((org) => {
      return {
        _id: org._id,
        label: org.name,
        image: org.avatar === null ? undefined : org.avatar
      }
    })
    if (value !== undefined) {
      selected = items.find((p) => p._id === value)
    }
    resolved = true
  })

  $: if (resolved) {
    setValue(selected)
  }

  function setValue (selected: ListItem | undefined): void {
    if (selected === undefined) {
      value = undefined
    } else {
      value = selected._id as Ref<Organization>
    }
    dispatch('change', value)
  }
</script>

<Dropdown
  {focusIndex}
  icon={Company}
  {label}
  placeholder={label}
  {items}
  bind:selected
  {kind}
  {size}
  {justify}
  {width}
  {labelDirection}
/>
