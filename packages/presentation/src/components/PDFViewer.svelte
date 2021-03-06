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
  import { Button, Panel } from '@anticrm/ui'
  import type { PopupOptions } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import presentation from '..'
  import { getFileUrl } from '../utils'
  import MaximizeH from './icons/MaximizeH.svelte'
  import MaximizeV from './icons/MaximizeV.svelte'
  import MaximizeO from './icons/MaximizeO.svelte'
  import Download from './icons/Download.svelte'

  export let file: string
  export let name: string
  export let contentType: string | undefined
  export let options: PopupOptions

  const dispatch = createEventDispatcher()
  let imgView: 'img-horizontal-fit' | 'img-vertical-fit' | 'img-original-fit' = 'img-horizontal-fit'

  function iconLabel (name: string): string {
    const parts = name.split('.')
    const ext = parts[parts.length - 1]
    return ext.substring(0, 4).toUpperCase()
  }
</script>

<Panel
  isHeader={false}
  isAside={options && options.fullSize}
  isFullSize
  on:fullsize
  on:close={() => {
    dispatch('close')
  }}
>
  <svelte:fragment slot="title">
    <div class="antiTitle icon-wrapper">
      <div class="wrapped-icon">
        <div class="flex-center icon">
          {iconLabel(name)}
        </div>
      </div>
      <span class="wrapped-title">{name}</span>
    </div>
  </svelte:fragment>

  <svelte:fragment slot="utils">
    {#if contentType && contentType.startsWith('image/')}
      <Button
        icon={MaximizeH}
        kind={'transparent'}
        shape={'circle'}
        on:click={() => {
          imgView = 'img-horizontal-fit'
        }}
        selected={imgView === 'img-horizontal-fit'}
      />
      <Button
        icon={MaximizeV}
        kind={'transparent'}
        shape={'circle'}
        on:click={() => {
          imgView = 'img-vertical-fit'
        }}
        selected={imgView === 'img-vertical-fit'}
      />
      <Button
        icon={MaximizeO}
        kind={'transparent'}
        shape={'circle'}
        on:click={() => {
          imgView = 'img-original-fit'
        }}
        selected={imgView === 'img-original-fit'}
      />
      <div class="buttons-divider" />
    {/if}
    <a class="no-line" href={getFileUrl(file)} download={name}>
      <Button
        icon={Download}
        kind={'transparent'}
        shape={'circle'}
        showTooltip={{ label: presentation.string.Download }}
      />
    </a>
  </svelte:fragment>

  {#if contentType && contentType.startsWith('image/')}
    <div class="pdfviewer-content">
      <img class={imgView} src={getFileUrl(file)} alt="" />
    </div>
  {:else}
    <iframe class="pdfviewer-content" src={getFileUrl(file)} title="" />
  {/if}
</Panel>

<style lang="scss">
  .icon {
    position: relative;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    font-weight: 500;
    font-size: 0.625rem;
    color: var(--white-color);
    background-color: var(--primary-bg-color);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .pdfviewer-content {
    flex-grow: 1;
    overflow: auto;
    margin: 1.5rem;
    border-style: none;
    border-radius: 0.5rem;
    background-color: var(--theme-menu-color);
  }
  .img-horizontal-fit,
  .img-vertical-fit,
  .img-original-fit {
    margin: 0 auto;
    width: auto;
    height: auto;
  }
  .img-horizontal-fit {
    width: 100%;
  }
  .img-vertical-fit {
    height: 100%;
  }
  .pdfviewer-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    flex-direction: row-reverse;
    align-items: center;
  }
  .img-nav {
    display: grid;
    grid-template-columns: auto;
    grid-auto-flow: column;
    grid-auto-columns: min-content;
    gap: 0.5rem;
    align-items: center;
  }
</style>
