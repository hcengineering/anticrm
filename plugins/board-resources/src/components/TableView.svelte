<script lang="ts">
  import { Card } from '@anticrm/board'
  import { Class, FindOptions, Ref } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import task, { SpaceWithStates, State } from '@anticrm/task'
  import tags from '@anticrm/tags'
  import { TableBrowser } from '@anticrm/view-resources'
  import board from '../plugin'

  export let _class: Ref<Class<Card>>
  export let space: Ref<SpaceWithStates>
  export let options: FindOptions<Card> | undefined

  const isArchived = { $nin: [true] }
  const query = createQuery()
  let states: Ref<State>[] = []
  $: query.query(task.class.State, { space, isArchived }, (result) => {
    states = result.map(({ _id }) => _id)
  })
</script>

<TableBrowser
  {_class}
  config={[
    'title',
    '$lookup.state',
    {
      key: '',
      presenter: tags.component.TagsPresenter,
      label: board.string.Labels,
      sortingKey: 'labels',
      props: {
        _class: board.class.Card,
        key: 'labels'
      }
    },
    'startDate',
    'dueDate',
    { key: 'members', presenter: board.component.UserBoxList, label: board.string.Members, sortingKey: 'members' },
    'modifiedOn'
  ]}
  {options}
  query={{ isArchived, state: { $in: states } }}
/>
