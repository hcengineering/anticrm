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
  import type { IntlString } from '@anticrm/platform'
  import { Button, IconClose, Label, MiniToggle } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import presentation from '..'

  export let label: IntlString
  export let labelProps: any | undefined = undefined
  export let okAction: () => Promise<void> | void
  export let canSave: boolean = false
  export let createMore: boolean | undefined = undefined
  export let okLabel: IntlString = presentation.string.Create

  const dispatch = createEventDispatcher()

  let okProcessing = false
</script>

<form id={label} class="antiCard dialog" on:submit|preventDefault={() => {}}>
  <div class="antiCard-header">
    <div class="antiCard-header__title-wrap">
      {#if $$slots.header}
        <slot name="header" />
        <span class="antiCard-header__divider">›</span>
      {/if}
      <span class="antiCard-header__title">
        {#if $$slots.title}
          <slot name="title" />
        {:else}
          <Label {label} params={labelProps ?? {}} />
        {/if}
      </span>
    </div>
    <div class="buttons-group small-gap">
      <Button
        id="card-close"
        focusIndex={10002}
        icon={IconClose}
        kind={'transparent'}
        on:click={() => {
          dispatch('close')
        }}
      />
    </div>
  </div>
  <div class="antiCard-content"><slot /></div>
  {#if $$slots.header || $$slots.pool}
    <div class="antiCard-pool">
      <slot name="pool" />
    </div>
  {/if}
  <div class="antiCard-footer reverse">
    <div class="buttons-group text-sm flex-no-shrink">
      {#if $$slots.buttons}
        <slot name="buttons" />
      {/if}
      {#if createMore !== undefined}
        <MiniToggle label={presentation.string.CreateMore} bind:on={createMore} />
      {/if}
      <Button
        loading={okProcessing}
        focusIndex={10001}
        disabled={!canSave}
        label={okLabel}
        kind={'primary'}
        on:click={() => {
          if (okProcessing) {
            return
          }
          okProcessing = true
          const r = okAction()
          if (r instanceof Promise) {
            r.then(() => {
              okProcessing = false
              dispatch('close')
            })
          } else if (!createMore) {
            okProcessing = false
            dispatch('close')
          }
        }}
      />
    </div>
    <div class="buttons-group small-gap text-sm">
      <slot name="footer" />
      {#if $$slots.error}
        <div class="antiCard-footer__error">
          <slot name="error" />
        </div>
      {/if}
    </div>
  </div>
</form>
