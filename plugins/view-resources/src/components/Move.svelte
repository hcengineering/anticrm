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
  import { Label, Button, Status as StatusControl } from '@anticrm/ui'
  import { getClient } from '@anticrm/presentation'

  import core, { AttachedDoc, Collection, Doc, Ref, Space, SortingOrder, Client, Class } from '@anticrm/core'
  import { SpaceSelect } from '@anticrm/presentation'
  import { createEventDispatcher } from 'svelte'
  import view from '../plugin'
  import task, { Task, calcRank } from '@anticrm/task'
  import { getResource, OK, Resource, Status, translate } from '@anticrm/platform'

  export let object: Doc

  let status: Status = OK
  let currentSpace: Space | undefined
  const client = getClient()
  const dispatch = createEventDispatcher()
  const hierarchy = client.getHierarchy()
  let label = ''
  $: _class = currentSpace ? hierarchy.getClass(currentSpace._class).label : undefined
  let classLabel = ''
  $: translate(hierarchy.getClass(object._class).label, {}).then((res) => (label = res.toLocaleLowerCase()))
  $: _class && translate(_class, {}).then((res) => (classLabel = res.toLocaleLowerCase()))

  async function move (doc: Doc): Promise<void> {
    const attributes = hierarchy.getAllAttributes(doc._class)
    for (const [name, attribute] of attributes) {
      if (hierarchy.isDerived(attribute.type._class, core.class.Collection)) {
        const collection = attribute.type as Collection<AttachedDoc>
        const allAttached = await client.findAll(collection.of, { attachedTo: doc._id })
        for (const attached of allAttached) {
          move(attached).catch((err) => console.log('failed to move', name, err))
        }
      }
    }
    const update: any = {
      space: doc.space
    }
    const needStates = currentSpace ? hierarchy.isDerived(currentSpace._class, task.class.SpaceWithStates) : false
    if (needStates) {
      const state = await client.findOne(task.class.State, { space: doc.space })
      if (state === undefined) {
        throw new Error('Move: state not found')
      }
      const lastOne = await client.findOne(
        (doc as Task)._class,
        { state: state._id },
        { sort: { rank: SortingOrder.Descending } }
      )
      update.state = state._id
      update.rank = calcRank(lastOne, undefined)
    }
    client.updateDoc(doc._class, doc.space, doc._id, update)
    dispatch('close')
  }

  async function getSpace (): Promise<void> {
    client.findOne(core.class.Space, { _id: object.space }).then((res) => (currentSpace = res))
  }

  async function invokeValidate (
    action: Resource<<T extends Doc>(doc: T, client: Client) => Promise<Status>>
  ): Promise<Status> {
    const impl = await getResource(action)
    return await impl(object, client)
  }

  async function validate (doc: Doc, _class: Ref<Class<Doc>>): Promise<void> {
    const clazz = hierarchy.getClass(_class)
    const validatorMixin = hierarchy.as(clazz, view.mixin.ObjectValidator)
    if (validatorMixin?.validator != null) {
      status = await invokeValidate(validatorMixin.validator)
    } else if (clazz.extends != null) {
      await validate(doc, clazz.extends)
    } else {
      status = OK
    }
  }

  $: validate(object, object._class)
</script>

<div class="container">
  <div class="overflow-label fs-title">
    <Label label={view.string.MoveClass} params={{ class: label }} />
  </div>
  <StatusControl {status} />
  <div class="content-accent-color mt-4 mb-4">
    <Label label={view.string.SelectToMove} params={{ class: label, classLabel: classLabel }} />
  </div>
  <div class="spaceSelect">
    {#await getSpace() then}
      {#if currentSpace && _class}
        <SpaceSelect _class={currentSpace._class} label={_class} bind:value={object.space} />
      {/if}
    {/await}
  </div>
  <div class="footer">
    <Button
      label={view.string.Move}
      size={'small'}
      disabled={object.space === currentSpace?._id || status !== OK}
      kind={'primary'}
      on:click={() => {
        move(object)
      }}
    />
    <Button
      size={'small'}
      label={view.string.Cancel}
      on:click={() => {
        dispatch('close')
      }}
    />
  </div>
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;
    padding: 2rem 1.75rem 1.75rem;
    width: 25rem;
    max-width: 40rem;
    background: var(--theme-msgbox-bg);
    border-radius: 1.25rem;
    user-select: none;
    box-shadow: var(--theme-msgbox-shadow);

    .spaceSelect {
      padding: 1rem 1.25rem;
      background-color: var(--theme-button-bg-enabled);
      border: 1px solid var(--theme-bg-accent-color);
      border-radius: 0.75rem;
    }

    .footer {
      flex-shrink: 0;
      display: grid;
      grid-auto-flow: column;
      direction: rtl;
      justify-content: start;
      align-items: center;
      margin-top: 1rem;
      column-gap: 0.5rem;
    }
  }
</style>
