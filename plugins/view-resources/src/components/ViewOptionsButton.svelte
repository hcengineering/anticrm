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
  import { Button, eventToHTMLElement, IconDownOutline, showPopup, Label } from '@anticrm/ui'
  import view from '@anticrm/view'
  import ViewOptionsPopup from './ViewOptionsPopup.svelte'
  import { getViewOptions, setViewOptions, viewOptionsStore, ViewOptionModel } from '../viewOptions'

  export let config: ViewOptionModel[]
  export let viewOptionsKey: string

  $: loadViewOptionsStore(config, viewOptionsKey)

  function loadViewOptionsStore (config: ViewOptionModel[], key: string) {
    viewOptionsStore.set(
      config.reduce(
        (options, { key, defaultValue }) => ({ [key]: defaultValue, ...options }),
        getViewOptions(key) ?? {}
      )
    )
  }

  const handleOptionsEditorOpened = (event: MouseEvent) => {
    showPopup(
      ViewOptionsPopup,
      { config, viewOptions: $viewOptionsStore },
      eventToHTMLElement(event),
      undefined,
      (result) => {
        if (result?.key === undefined) return
        $viewOptionsStore[result.key] = result.value
        setViewOptions(viewOptionsKey, $viewOptionsStore)
      }
    )
  }
</script>

<Button
  icon={view.icon.ViewButton}
  kind={'secondary'}
  size={'small'}
  showTooltip={{ label: view.string.CustomizeView }}
  on:click={handleOptionsEditorOpened}
>
  <svelte:fragment slot="content">
    <div class="flex-row-center clear-mins pointer-events-none">
      <span class="text-sm font-medium"><Label label={view.string.View} /></span>
      <div class="icon"><IconDownOutline size={'full'} /></div>
    </div>
  </svelte:fragment>
</Button>

<style lang="scss">
  .icon {
    margin-left: 0.25rem;
    width: 0.875rem;
    height: 0.875rem;
    color: var(--content-color);
  }
</style>
