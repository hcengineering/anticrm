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
  import { getResource } from '@anticrm/platform'
  import type { AnyComponent } from '../types'
  // import Icon from './Icon.svelte'
  import ErrorPresenter from './ErrorPresenter.svelte'
  import ErrorBoundary from './internal/ErrorBoundary'
  import Loading from './Loading.svelte'

  export let is: AnyComponent
  export let props = {}
  export let shrink: boolean = false
  export let showLoading = true

  $: component = is != null ? getResource(is) : Promise.reject(new Error('is not defined'))
</script>

{#if is}
  {#await component}
    {#if showLoading}
      <Loading {shrink} />
    {/if}
  {:then Ctor}
    <ErrorBoundary>
      <Ctor {...props} on:change on:close on:open on:click on:delete>
        {#if $$slots.default}
          <slot />
        {/if}
      </Ctor>
    </ErrorBoundary>
  {:catch err}
    <pre style="max-height: 140px; overflow: auto;">
      <ErrorPresenter error={err} />
    </pre>
    <!-- <Icon icon={ui.icon.Error} size="32" /> -->
  {/await}
{/if}
