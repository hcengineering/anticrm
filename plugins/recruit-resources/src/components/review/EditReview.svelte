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
  import calendar from '@anticrm/calendar'
  import contact, { Contact } from '@anticrm/contact'
  import { getClient, UserBox } from '@anticrm/presentation'
  import type { Review } from '@anticrm/recruit'
  import { FullDescriptionBox } from '@anticrm/text-editor'
  import { EditBox, Grid, showPanel } from '@anticrm/ui'
  import view from '@anticrm/view'
  import { createEventDispatcher, onMount } from 'svelte'
  import recruit from '../../plugin'

  export let object: Review

  const dispatch = createEventDispatcher()
  const client = getClient()

  let oldTitle: string = ''
  let rawTitle: string = ''
  $: if (oldTitle !== object.title) {
    oldTitle = object.title
    rawTitle = object.title
  }

  onMount(() => {
    dispatch('open', {
      ignoreKeys: ['number', 'comments', 'title', 'description', 'verdict'],
      ignoreMixins: [calendar.mixin.Reminder]
    })
  })

  let candidate: Contact | undefined = undefined

  async function updateSelected (object: Review) {
    candidate = await client.findOne<Contact>(object.attachedToClass, { _id: object.attachedTo })
  }

  $: updateSelected(object)
</script>

{#if object !== undefined}
  <Grid column={1} rowGap={1.5}>
    <Grid column={2} columnGap={1}>
      <EditBox
        bind:value={rawTitle}
        kind={'large-style'}
        maxWidth={'20rem'}
        focusable
        on:blur={() => {
          if (rawTitle !== object.title) client.update(object, { title: rawTitle })
        }}
      />
      <div
        class="clear-mins"
        on:click={() => {
          if (candidate !== undefined) {
            showPanel(view.component.EditDoc, candidate._id, candidate._class, 'content')
          }
        }}
      >
        <UserBox
          readonly
          _class={contact.class.Person}
          label={recruit.string.Talent}
          placeholder={recruit.string.Talents}
          value={object.attachedTo}
          kind={'link'}
          size={'x-large'}
          justify={'left'}
          width={'100%'}
        />
      </div>
    </Grid>
    <FullDescriptionBox
      label={recruit.string.Description}
      content={object.description}
      on:save={(res) => {
        client.update(object, { description: res.detail })
      }}
    />
    <EditBox
      bind:value={object.verdict}
      placeholder={recruit.string.Verdict}
      kind={'large-style'}
      maxWidth={'39rem'}
      focusable
      on:change={() => client.update(object, { verdict: object.verdict })}
    />
  </Grid>
{/if}
