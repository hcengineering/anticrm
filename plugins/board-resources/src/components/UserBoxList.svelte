<script lang="ts">
  import { Employee } from '@anticrm/contact'
  import { Ref } from '@anticrm/core'

  import { UserBoxList } from '@anticrm/presentation'
  import board from '../plugin'

  export let value: Ref<Employee>[]
</script>

<UserBoxList items={value} label={board.string.Members} on:update />
