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
  import contact, { formatName, Person } from '@anticrm/contact'
  import { Ref } from '@anticrm/core'
  import { getClient } from '@anticrm/presentation'
  import type { Applicant } from '@anticrm/recruit'
  import { Icon, Label } from '@anticrm/ui'
  import recruit from '../plugin'

  export let value: Applicant

  const client = getClient()
  const shortLabel = client.getHierarchy().getClass(value._class).shortLabel

  let person: Person | undefined

  $: client.findOne(contact.class.Person, { _id: value.attachedTo as Ref<Person> }).then((p) => {
    person = p
  })
</script>

<div class="flex item">
  <Icon icon={recruit.icon.Application} size={'medium'} />
  <div class="ml-2">
    {#if shortLabel}<Label label={shortLabel} />-{/if}{value.number}
  </div>
  {#if person}
    <div class="ml-1">{formatName(person.name)}</div>
  {/if}
</div>

<style lang="scss">
  .item {
    align-items: center;
  }
</style>
