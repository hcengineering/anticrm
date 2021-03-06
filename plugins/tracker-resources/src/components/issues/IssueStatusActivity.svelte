<script lang="ts">
  import core, { Ref, Timestamp, Tx, TxCollectionCUD, TxCreateDoc, TxUpdateDoc, WithLookup } from '@anticrm/core'
  import { createQuery } from '@anticrm/presentation'
  import { Issue, IssueStatus } from '@anticrm/tracker'
  import { Label, ticker } from '@anticrm/ui'
  import tracker from '../../plugin'
  import Duration from './Duration.svelte'
  import StatusPresenter from './StatusPresenter.svelte'

  export let issue: Issue

  const query = createQuery()

  let txes: Tx[] = []

  interface WithTime {
    status: WithLookup<IssueStatus>
    duration: number
  }

  const stQuery = createQuery()

  let statuses = new Map<Ref<IssueStatus>, WithLookup<IssueStatus>>()

  stQuery.query(
    tracker.class.IssueStatus,
    {},
    (res) => {
      statuses = new Map(res.map((it) => [it._id, it]))
    },
    {
      lookup: {
        category: tracker.class.IssueStatusCategory
      }
    }
  )

  $: query.query(
    core.class.Tx,
    { 'tx.objectId': issue._id },
    (res) => {
      txes = res
    },
    { sort: { modifiedOn: 1 } }
  )

  let displaySt: WithTime[] = []
  async function updateStatus (
    txes: Tx[],
    statuses: Map<Ref<IssueStatus>, WithLookup<IssueStatus>>,
    now: number
  ): Promise<void> {
    const result: WithTime[] = []

    let current: Ref<IssueStatus> | undefined
    let last: Timestamp = Date.now()
    for (let it of txes) {
      if (it._class === core.class.TxCollectionCUD) {
        it = (it as TxCollectionCUD<Issue, Issue>).tx
      }
      let newStatus: Ref<IssueStatus> | undefined
      if (it._class === core.class.TxCreateDoc) {
        const op = it as TxCreateDoc<Issue>
        if (op.attributes.status !== undefined) {
          newStatus = op.attributes.status
          last = it.modifiedOn
        }
      }
      if (it._class === core.class.TxUpdateDoc) {
        const op = it as TxUpdateDoc<Issue>
        if (op.operations.status !== undefined) {
          newStatus = op.operations.status
        }
      }
      if (current === undefined) {
        current = newStatus
        last = it.modifiedOn
      } else if (current !== newStatus && newStatus !== undefined) {
        let stateValue = result.find((it) => it.status?._id === current)
        if (stateValue === undefined) {
          stateValue = { status: statuses.get(current) as IssueStatus, duration: 0 }
          result.push(stateValue)
        }
        stateValue.duration += it.modifiedOn - last
        current = newStatus
        last = it.modifiedOn
      }
    }
    if (current !== undefined) {
      let stateValue = result.find((it) => it.status?._id === current)
      if (stateValue === undefined) {
        stateValue = { status: statuses.get(current) as IssueStatus, duration: 0 }
        result.push(stateValue)
      }
      stateValue.duration += Date.now() - last
    }

    result.sort((a, b) => b.duration - a.duration)
    displaySt = result
  }

  $: updateStatus(txes, statuses, $ticker)
</script>

<div class="flex-row mt-4 mb-4">
  <Label label={tracker.string.StatusHistory} />:
  <table class="ml-2">
    {#each displaySt as st}
      <tr>
        <td class="flex-row-center mt-2 mb-2">
          <StatusPresenter value={st.status} />
        </td>
        <td>
          <div class="ml-2 mr-2">
            <Duration value={st.duration} />
          </div>
        </td>
      </tr>
    {/each}
  </table>
</div>
