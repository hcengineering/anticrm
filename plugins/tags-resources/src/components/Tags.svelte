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
  import type { Class, Doc, Ref } from '@anticrm/core'
  import { createQuery, getClient, KeyedAttribute } from '@anticrm/presentation'
  import { TagElement, TagReference } from '@anticrm/tags'
  import tags from '../plugin'
  import TagsEditor from './TagsEditor.svelte'

  export let object: Doc
  export let _class: Ref<Class<Doc>>
  export let key: KeyedAttribute

  const client = getClient()

  let items: TagReference[] = []
  const query = createQuery()

  $: query.query(
    tags.class.TagReference,
    { attachedTo: object._id, attachedToClass: _class },
    (result) => {
      items = result
    },
    { sort: { title: 1 } }
  )

  async function addRef (tag: TagElement): Promise<void> {
    await client.addCollection(tags.class.TagReference, object.space, object._id, _class, key.key, {
      title: tag.title,
      tag: tag._id,
      color: tag.color
    })
  }

  async function removeTag (id: Ref<TagReference>): Promise<void> {
    await client.removeCollection(tags.class.TagReference, object.space, id, object._id, _class, key.key)
  }

  let elements: Map<Ref<TagElement>, TagElement> = new Map()
  const elementQuery = createQuery()
  $: elementQuery.query(tags.class.TagElement, {}, (result) => {
    elements = new Map(result.map((it) => [it._id, it]))
  })
</script>

<TagsEditor
  bind:elements
  {key}
  bind:items
  targetClass={_class}
  on:open={(evt) => addRef(evt.detail)}
  on:delete={(evt) => removeTag(evt.detail)}
/>
