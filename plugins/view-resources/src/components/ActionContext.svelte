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
  import { generateId } from '@anticrm/core'
  import { ViewContext } from '@anticrm/view'
  import { onDestroy } from 'svelte'
  import { contextStore } from '../context'

  export let context: ViewContext

  const id = generateId()

  $: len = $contextStore.findIndex((it) => (it as any).id === id)

  onDestroy(() => {
    contextStore.update((t) => {
      return t.slice(0, len ?? 0)
    })
  })

  $: {
    contextStore.update((cur) => {
      const pos = cur.findIndex((it) => (it as any).id === id)
      const newCur = {
        id,
        mode: context.mode,
        application: context.application ?? cur[(pos !== -1 ? pos : cur.length) - 1]?.application
      }
      if (pos === -1) {
        len = cur.length
        return [...cur, newCur]
      }
      len = pos
      return [...cur.slice(0, pos), newCur]
    })
  }
</script>
