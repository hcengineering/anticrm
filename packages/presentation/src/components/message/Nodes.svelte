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
  import { CheckBox, Component, navigate, parseLocation } from '@anticrm/ui'
  import view from '@anticrm/view'

  export let nodes: NodeListOf<any>
</script>

{#if nodes}
  {#each nodes as node}
    {#if node.nodeType === Node.TEXT_NODE}
      {node.data}
    {:else if node.nodeName === 'EM'}
      <em><svelte:self nodes={node.childNodes} /></em>
    {:else if node.nodeName === 'STRONG'}
      <strong><svelte:self nodes={node.childNodes} /></strong>
    {:else if node.nodeName === 'P'}
      <p class="p-inline"><svelte:self nodes={node.childNodes} /></p>
    {:else if node.nodeName === 'BLOCKQUOTE'}
      <blockquote><svelte:self nodes={node.childNodes} /></blockquote>
    {:else if node.nodeName === 'CODE'}
      <code><svelte:self nodes={node.childNodes} /></code>
    {:else if node.nodeName === 'PRE'}
      <pre><svelte:self nodes={node.childNodes} /></pre>
    {:else if node.nodeName === 'BR'}
      <br />
    {:else if node.nodeName === 'HR'}
      <hr />
    {:else if node.nodeName === 'IMG'}
      <div class="max-h-60 max-w-60 img">{@html node.outerHTML}</div>
    {:else if node.nodeName === 'H1'}
      <h1><svelte:self nodes={node.childNodes} /></h1>
    {:else if node.nodeName === 'H2'}
      <h2><svelte:self nodes={node.childNodes} /></h2>
    {:else if node.nodeName === 'H3'}
      <h3><svelte:self nodes={node.childNodes} /></h3>
    {:else if node.nodeName === 'H4'}
      <h4><svelte:self nodes={node.childNodes} /></h4>
    {:else if node.nodeName === 'H5'}
      <h5><svelte:self nodes={node.childNodes} /></h5>
    {:else if node.nodeName === 'H6'}
      <h6><svelte:self nodes={node.childNodes} /></h6>
    {:else if node.nodeName === 'UL'}
      <ul><svelte:self nodes={node.childNodes} /></ul>
    {:else if node.nodeName === 'OL'}
      <ol><svelte:self nodes={node.childNodes} /></ol>
    {:else if node.nodeName === 'LI'}
      <li class={node.className}><svelte:self nodes={node.childNodes} /></li>
    {:else if node.nodeName === 'DIV'}
      <div><svelte:self nodes={node.childNodes} /></div>
    {:else if node.nodeName === 'A'}
      <a
        href={node.getAttribute('href')}
        target={node.getAttribute('target')}
        on:click={(e) => {
          try {
            const url = new URL(node.getAttribute('href'))

            if (url.origin === window.location.origin) {
              e.preventDefault()
              navigate(parseLocation(url))
            }
          } catch {}
        }}><svelte:self nodes={node.childNodes} /></a
      >
    {:else if node.nodeName === 'LABEL'}
      <svelte:self nodes={node.childNodes} />
    {:else if node.nodeName === 'INPUT'}
      {#if node.type?.toLowerCase() === 'checkbox'}
        <div class="checkboxContainer">
          <CheckBox readonly checked={node.checked} />
        </div>
      {/if}
    {:else if node.nodeName === 'SPAN'}
      <Component
        is={view.component.ObjectPresenter}
        props={{
          objectId: node.getAttribute('data-id'),
          title: node.getAttribute('data-label'),
          _class: node.getAttribute('data-objectclass'),
          props: {
            shouldShowAvatar: false
          }
        }}
      />
    {:else}
      Unknown {node.nodeName}
    {/if}
  {/each}
{/if}

<style lang="scss">
  .img {
    :global(img) {
      object-fit: contain;
      height: 100%;
      width: 100%;
    }
  }

  .checkboxContainer {
    padding-top: 0.125rem;
  }
</style>
