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
  import { resizeObserver } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'

  export let width: number = 0
  export let key: string
  export let justify: string = ''

  const dispatch = createEventDispatcher()

  let cWidth: number
  $: if (cWidth > width) {
    width = cWidth
    dispatch('update', cWidth)
  }
</script>

<div
  class="flex-no-shrink"
  style="{justify !== '' ? `text-align: ${justify}; ` : ''}min-width: var(--fixed-{key});"
  use:resizeObserver={(element) => {
    cWidth = element.clientWidth
  }}
>
  <slot />
</div>
