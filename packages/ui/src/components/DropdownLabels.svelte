<!--
// Copyright © 2020, 2021 Anticrm Platform Contributors.
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
  import type { AnySvelteComponent, DropdownTextItem, TooltipAlignment, ButtonKind, ButtonSize } from '../types'
  import { createEventDispatcher } from 'svelte'
  import ui from '../plugin'
  import { showPopup } from '../popups'
  import { getFocusManager } from '../focus'
  import Button from './Button.svelte'
  import DropdownLabelsPopup from './DropdownLabelsPopup.svelte'
  import Label from './Label.svelte'

  export let icon: Asset | AnySvelteComponent | undefined = undefined
  export let label: IntlString
  export let placeholder: IntlString | undefined = ui.string.SearchDots
  export let items: DropdownTextItem[]
  export let selected: DropdownTextItem['id'] | undefined = undefined

  export let kind: ButtonKind = 'no-border'
  export let size: ButtonSize = 'small'
  export let justify: 'left' | 'center' = 'center'
  export let width: string | undefined = undefined
  export let labelDirection: TooltipAlignment | undefined = undefined
  export let focusIndex = -1
  export let autoSelect: boolean = true

  let container: HTMLElement
  let opened: boolean = false
  let isDisabled = false
  $: isDisabled = items.length === 0

  let selectedItem = items.find((x) => x.id === selected)
  $: selectedItem = items.find((x) => x.id === selected)
  $: if (autoSelect && selected === undefined && items[0] !== undefined) {
    selected = items[0].id
  }

  const dispatch = createEventDispatcher()
  const mgr = getFocusManager()
</script>

<div bind:this={container} class="min-w-0">
  <Button
    {focusIndex}
    {icon}
    width={width ?? 'min-content'}
    {size}
    {kind}
    {justify}
    showTooltip={{ label, direction: labelDirection }}
    on:click={() => {
      if (!opened) {
        opened = true
        showPopup(DropdownLabelsPopup, { placeholder, items, selected }, container, (result) => {
          if (result) {
            selected = result
            dispatch('selected', result)
          }
          opened = false
          mgr?.setFocusPos(focusIndex)
        })
      }
    }}
  >
    <span slot="content" class="overflow-label disabled">
      {#if selectedItem}{selectedItem.label}{:else}<Label label={label ?? ui.string.NotSelected} />{/if}
    </span>
  </Button>
</div>
