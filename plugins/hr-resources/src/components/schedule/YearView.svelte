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
  import { EmployeePresenter } from '@anticrm/contact-resources'
  import contact from '@anticrm/contact-resources/src/plugin'
  import { Ref } from '@anticrm/core'
  import type { Request, RequestType, Staff } from '@anticrm/hr'
  import { Label, LabelAndProps, Scroller, tooltip } from '@anticrm/ui'
  import hr from '../../plugin'
  import { fromTzDate, getMonth, getTotal, weekDays } from '../../utils'
  import RequestsPopup from '../RequestsPopup.svelte'

  export let currentDate: Date = new Date()

  export let departmentStaff: Staff[]
  export let types: Map<Ref<RequestType>, RequestType>

  export let employeeRequests: Map<Ref<Staff>, Request[]>

  const todayDate = new Date()

  function getRequests (employeeRequests: Map<Ref<Staff>, Request[]>, employee: Ref<Staff>, date: Date): Request[] {
    const requests = employeeRequests.get(employee)
    if (requests === undefined) return []
    const res: Request[] = []
    const time = date.getTime()
    const endTime = getEndDate(date)
    for (const request of requests) {
      if (fromTzDate(request.tzDate) <= endTime && fromTzDate(request.tzDueDate) > time) {
        res.push(request)
      }
    }
    return res
  }

  function getEndDate (date: Date): number {
    return new Date(date).setMonth(date.getMonth() + 1)
  }

  function getTooltip (requests: Request[]): LabelAndProps | undefined {
    if (requests.length === 0) return
    return {
      component: RequestsPopup,
      props: { requests: requests.map((it) => it._id) }
    }
  }

  $: values = [...Array(12).keys()]

  function getMonthName (date: Date): string {
    return new Intl.DateTimeFormat('default', { month: 'long' }).format(date)
  }

  let hoveredIndex: number = -1
</script>

{#if departmentStaff.length}
  <Scroller tableFade>
    <table>
      <thead class="scroller-thead">
        <tr class="scroller-thead__tr">
          <th>
            <Label label={contact.string.Employee} />
          </th>
          {#each values as value, i}
            {@const month = getMonth(currentDate, value)}
            <th
              class="fixed"
              class:today={month.getFullYear() === todayDate.getFullYear() && month.getMonth() === todayDate.getMonth()}
              on:mousemove={() => {
                hoveredIndex = i
              }}
              on:mouseleave={() => {
                hoveredIndex = -1
              }}
            >
              {getMonthName(month)}
            </th>
          {/each}
        </tr>
        <tr>
          <th class="fixed">
            <span class="flex-center">
              {departmentStaff.length}
            </span>
          </th>
          {#each values as value, i}
            {@const month = getMonth(currentDate, value)}
            <th
              class="fixed"
              class:today={month.getFullYear() === todayDate.getFullYear() && month.getMonth() === todayDate.getMonth()}
            >
              <span class="flex-center">
                {weekDays(month.getUTCFullYear(), month.getUTCMonth())}
              </span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each departmentStaff as employee, row}
          <tr>
            <td>
              <EmployeePresenter value={employee} />
            </td>
            {#each values as value, i}
              {@const month = getMonth(currentDate, value)}
              {@const requests = getRequests(employeeRequests, employee._id, month)}
              {@const tooltipValue = getTooltip(requests)}
              {#key tooltipValue}
                <td
                  class:today={month.getFullYear() === todayDate.getFullYear() &&
                    month.getMonth() === todayDate.getMonth()}
                  class="fixed"
                  use:tooltip={tooltipValue}
                >
                  <div class="flex-center">
                    {getTotal(requests, types)}
                  </div>
                </td>
              {/key}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </Scroller>
{:else}
  <div class="flex-center h-full w-full flex-grow fs-title">
    <Label label={hr.string.NoEmployeesInDepartment} />
  </div>
{/if}

<style lang="scss">
  table {
    position: relative;
    width: 100%;

    td,
    th {
      width: auto;
      width: 2rem;
      min-width: 1.5rem;
      border: none;
      &.fixed {
        width: 5rem;
        padding: 0 0.125rem;
        hyphens: auto;
      }
      &:first-child {
        width: 15rem;
        padding: 0.5rem;
      }
    }
    th {
      flex-shrink: 0;
      padding: 0;
      height: 2.5rem;
      min-height: 2.5rem;
      max-height: 2.5rem;
      text-transform: uppercase;
      font-weight: 500;
      font-size: 0.75rem;
      line-height: 105%;
      color: var(--dark-color);
      box-shadow: inset 0 -1px 0 0 var(--divider-color);
      user-select: none;
      cursor: pointer;

      span {
        display: block;
        font-weight: 600;
        font-size: 1rem;
      }
      &.today {
        color: var(--caption-color);
      }
      &.weekend:not(.today) {
        color: var(--warning-color);
      }
    }
    td {
      height: 3.5rem;
      border: none;
      color: var(--caption-color);
      &.today {
        background-color: var(--theme-bg-accent-hover);
      }
      &.weekend:not(.today) {
        background-color: var(--theme-bg-accent-color);
      }
    }
    td:not(:last-child) {
      border-right: 1px solid var(--divider-color);
    }
    tr:not(.scroller-thead__tr) {
      border-bottom: 1px solid var(--divider-color);
    }
    tr.scroller-thead__tr:not(:last-child) {
      border-right: 1px solid var(--divider-color);
    }

    .hovered {
      position: relative;

      &::after {
        position: absolute;
        content: '';
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--caption-color);
        opacity: 0.15;
      }
    }
  }
</style>
