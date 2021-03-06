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
  import { Asset } from '@anticrm/platform'
  import { AnySvelteComponent, Icon, IconSize } from '@anticrm/ui'
  import { getBlobURL, getFileUrl } from '../utils'
  import Avatar from './icons/Avatar.svelte'

  export let avatar: string | null | undefined = undefined
  export let direct: Blob | undefined = undefined
  export let size: IconSize
  export let icon: Asset | AnySvelteComponent | undefined = undefined

  let url: string | undefined
  $: if (direct !== undefined) {
    getBlobURL(direct).then((blobURL) => {
      url = blobURL
    })
  } else if (avatar !== undefined && avatar !== null) {
    url = getFileUrl(avatar, size)
  } else {
    url = undefined
  }
</script>

<div class="ava-{size} flex-center avatar-container" class:no-img={!url}>
  {#if url}
    {#if size === 'large' || size === 'x-large'}
      <img class="ava-{size} ava-blur" src={url} alt={''} />
    {/if}
    <img class="ava-{size} ava-mask" src={url} alt={''} />
  {:else}
    <Icon icon={icon ?? Avatar} {size} />
  {/if}
</div>

<style lang="scss">
  .avatar-container {
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    background-color: var(--avatar-bg-color);
    border-radius: 50%;
    pointer-events: none;

    img {
      object-fit: cover;
      border: 2px solid var(--theme-avatar-border);
    }
    &.no-img {
      border-color: transparent;
    }
  }

  .ava-inline {
    width: 0.875rem; // 24
    height: 0.875rem;
  }

  .ava-tiny {
    width: 1.13rem; // ~18
    height: 1.13rem;
  }

  .ava-x-small {
    width: 1.5rem; // 24
    height: 1.5rem;
  }
  .ava-small {
    width: 2rem; // 32
    height: 2rem;
  }
  .ava-medium {
    width: 2.25rem; // 36
    height: 2.25rem;
  }
  .ava-large {
    width: 4.5rem; // 72
    height: 4.5rem;
  }
  .ava-x-large {
    width: 7.5rem; // 120
    height: 7.5rem;
  }

  .ava-blur {
    position: absolute;
    filter: blur(32px);
  }
  .ava-mask {
    position: absolute;
    border: 2px solid var(--theme-avatar-border);
    border-radius: 50%;
  }

  .ava-inline .ava-mask,
  .ava-inline.no-img,
  .ava-x-small .ava-mask,
  .ava-x-small.no-img,
  .ava-small .ava-mask,
  .ava-small.no-img,
  .ava-medium .ava-mask,
  .ava-medium.no-img {
    border-style: none;
  }
</style>
