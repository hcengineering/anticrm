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
  import { quintOut } from 'svelte/easing'
  import { tweened } from 'svelte/motion'

  export let isExpanded = false
  export let duration = 200
  export let easing: (t: number) => number = quintOut

  const tweenedHeight = tweened(0, { duration: duration, easing })

  let height = 0

  $: tweenedHeight.set(isExpanded ? height : 0, { duration, easing })
</script>

<div class="root" style="height: {$tweenedHeight}px">
  <div bind:offsetHeight={height}>
    <slot />
  </div>
</div>

<style lang="scss">
  .root {
    overflow: hidden;
  }
</style>
