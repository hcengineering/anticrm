<!--
// Copyright © 2021, 2022 Hardcore Engineering Inc.
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
  import { createEventDispatcher } from 'svelte'
  import { getResource } from '@anticrm/platform'
  import { Button } from '@anticrm/ui'
  import imageCropper from '@anticrm/image-cropper'
  import plugin from '../plugin'

  export let file: Blob
  let inputRef: HTMLInputElement
  const targetMimes = ['image/png', 'image/jpg', 'image/jpeg']

  const dispatch = createEventDispatcher()
  const CropperP = getResource(imageCropper.component.Cropper)
  let cropper: any

  function onSelect (e: any) {
    const newFile = e.target?.files[0] as File | undefined
    if (newFile === undefined || !targetMimes.includes(newFile.type)) {
      return
    }
    file = newFile

    e.target.value = null
  }

  async function onCrop () {
    const res = await cropper.crop()

    dispatch('close', res)
  }

  async function remove () {
    dispatch('close', null)
  }

  function selectAnother () {
    inputRef.click()
  }
</script>

<input style="display: none;" type="file" bind:this={inputRef} on:change={onSelect} accept={targetMimes.join(',')} />
<div
  class="overlay"
  on:click={() => {
    dispatch('close')
  }}
/>
<div class="root">
  {#await CropperP then Cropper}
    <div class="cropper">
      <Cropper bind:this={cropper} image={file} />
    </div>
    <div class="footer">
      <div>
        <Button label={plugin.string.Save} kind={'primary'} on:click={onCrop} />
      </div>
      <div class="ml-4 mr-4">
        <Button label={plugin.string.Change} on:click={selectAnother} />
      </div>
      <div>
        <Button label={plugin.string.Remove} on:click={remove} />
      </div>
    </div>
  {/await}
</div>

<style lang="scss">
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    background: var(--theme-menu-color);
    opacity: 0.7;
  }

  .root {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    overflow: auto;

    width: 75vw;
    height: 75vh;

    transform: translate(-50%, -50%);

    background: var(--theme-bg-color);
    border-radius: 1.25rem;
    box-shadow: 0px 44px 154px rgba(0, 0, 0, 0.75);

    display: grid;
    grid-template-rows: minmax(min-content, 1fr) auto;
  }

  .cropper {
    width: inherit;
  }

  .footer {
    display: flex;
    flex-direction: row-reverse;
    padding: 1rem 1.5rem;
  }
</style>
