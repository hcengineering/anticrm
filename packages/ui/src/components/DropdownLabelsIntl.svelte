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
  import { IntlString, Asset } from '@anticrm/platform'
  import { createEventDispatcher } from 'svelte'
  import type { AnySvelteComponent, TooltipAlignment, ButtonKind, ButtonSize, DropdownIntlItem } from '../types'
  import { showPopup } from '../popups'
  import Button from './Button.svelte'
  import DropdownLabelsPopupIntl from './DropdownLabelsPopupIntl.svelte'
  import Label from './Label.svelte'

  export let icon: Asset | AnySvelteComponent | undefined = undefined
  export let label: IntlString
  export let items: DropdownIntlItem[]
  export let selected: DropdownIntlItem['id'] | undefined = undefined
  export let disabled: boolean = false
  export let kind: ButtonKind = 'no-border'
  export let size: ButtonSize = 'small'
  export let justify: 'left' | 'center' = 'center'
  export let width: string | undefined = undefined
  export let labelDirection: TooltipAlignment | undefined = undefined

  let container: HTMLElement
  let opened: boolean = false

  $: selectedItem = items.find((x) => x.id === selected)
  $: if (selected === undefined && items[0] !== undefined) {
    selected = items[0].id
    dispatch('selected', selected)
  }

  const dispatch = createEventDispatcher()
</script>

<div bind:this={container} class="min-w-0">
  <Button
    {icon}
    width={width ?? 'min-content'}
    {size}
    {kind}
    {disabled}
    {justify}
    showTooltip={{ label, direction: labelDirection }}
    on:click={() => {
      if (!opened) {
        opened = true
        showPopup(DropdownLabelsPopupIntl, { items, selected }, container, (result) => {
          if (result) {
            selected = result
            dispatch('selected', result)
          }
          opened = false
        })
      }
    }}
  >
    <span slot="content" class="overflow-label disabled">
      <Label label={selectedItem ? selectedItem.label : label} />
    </span>
  </Button>
</div>
