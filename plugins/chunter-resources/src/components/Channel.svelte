<!--
// Copyright © 2020 Anticrm Platform Contributors.
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
  import attachment, { Attachment } from '@anticrm/attachment'
  import type { ChunterMessage, Message } from '@anticrm/chunter'
  import contact, { Employee } from '@anticrm/contact'
  import core, { Doc, Ref, Space, Timestamp, WithLookup } from '@anticrm/core'
  import { NotificationClientImpl } from '@anticrm/notification-resources'
  import { createQuery } from '@anticrm/presentation'
  import { location as locationStore } from '@anticrm/ui'
  import { afterUpdate, beforeUpdate, onDestroy } from 'svelte'
  import chunter from '../plugin'
  import { getDay, messageIdForScroll, shouldScrollToMessage, isMessageHighlighted, scrollAndHighLight } from '../utils'
  import ChannelSeparator from './ChannelSeparator.svelte'
  import JumpToDateSelector from './JumpToDateSelector.svelte'
  import MessageComponent from './Message.svelte'

  export let space: Ref<Space> | undefined
  export let pinnedIds: Ref<ChunterMessage>[]
  export let savedMessagesIds: Ref<ChunterMessage>[]
  export let savedAttachmentsIds: Ref<Attachment>[]
  export let isScrollForced = false

  let div: HTMLDivElement | undefined
  let autoscroll: boolean = false

  const unsubscribe = locationStore.subscribe((newLocation) => {
    const messageId = newLocation.fragment

    if (!messageId) {
      messageIdForScroll.set('')

      return
    }
    if (messageId === $messageIdForScroll) {
      return
    }
    messageIdForScroll.set(messageId)
    shouldScrollToMessage.set(true)
    scrollAndHighLight()
  })
  onDestroy(unsubscribe)

  beforeUpdate(() => {
    autoscroll = div !== undefined && div.offsetHeight + div.scrollTop > div.scrollHeight - 20
  })

  afterUpdate(() => {
    if ($shouldScrollToMessage && !$isMessageHighlighted) {
      scrollAndHighLight()

      return
    }
    if (div && (autoscroll || isScrollForced)) {
      div.scrollTo(0, div.scrollHeight)
      isScrollForced = false
    }
  })

  let messages: WithLookup<Message>[] | undefined
  let employees: Map<Ref<Employee>, Employee> = new Map<Ref<Employee>, Employee>()
  const query = createQuery()
  const employeeQuery = createQuery()

  const notificationClient = NotificationClientImpl.getClient()
  const lastViews = notificationClient.getLastViews()

  employeeQuery.query(
    contact.class.Employee,
    {},
    (res) =>
      (employees = new Map(
        res.map((r) => {
          return [r._id, r]
        })
      )),
    {
      lookup: { _id: { statuses: contact.class.Status } }
    }
  )

  $: updateQuery(space)

  function updateQuery (space: Ref<Space> | undefined) {
    if (space === undefined) {
      query.unsubscribe()
      messages = []
      return
    }
    query.query(
      chunter.class.Message,
      {
        space
      },
      (res) => {
        messages = res
        newMessagesPos = newMessagesStart(messages)
        notificationClient.updateLastView(space, chunter.class.ChunterSpace)
      },
      {
        lookup: {
          _id: { attachments: attachment.class.Attachment, reactions: chunter.class.Reaction },
          createBy: core.class.Account
        }
      }
    )
  }

  function newMessagesStart (messages: Message[]): number {
    if (space === undefined) return -1
    const lastView = $lastViews.get(space)
    if (lastView === undefined || lastView === -1) return -1
    for (let index = 0; index < messages.length; index++) {
      const message = messages[index]
      if (message.createOn > lastView) return index
    }
    return -1
  }

  $: markUnread($lastViews)
  function markUnread (lastViews: Map<Ref<Doc>, number>) {
    if (messages === undefined) return
    const newPos = newMessagesStart(messages)
    if (newPos !== -1 || newMessagesPos === -1) {
      newMessagesPos = newPos
    }
  }

  let newMessagesPos: number = -1

  function isOtherDay (time1: Timestamp, time2: Timestamp) {
    return getDay(time1) !== getDay(time2)
  }

  function handleJumpToDate (e: CustomEvent<any>) {
    const date = e.detail.date
    if (!date) {
      return
    }

    const dateSelectors = div?.getElementsByClassName('dateSelector')
    if (!dateSelectors) return

    let closestDate: Timestamp | undefined = parseInt(dateSelectors[dateSelectors.length - 1].id)

    for (const elem of Array.from(dateSelectors).reverse()) {
      const curDate = parseInt(elem.id)
      if (curDate < date) break
      else if (curDate - date < closestDate - date) {
        closestDate = curDate
      }
    }
    if (closestDate && closestDate < date) closestDate = undefined

    if (closestDate) {
      scrollToDate(closestDate)
    }
  }

  const pinnedHeight = 30
  const headerHeight = 50
  function scrollToDate (date: Timestamp) {
    let offset = date && document.getElementById(date.toString())?.offsetTop
    if (offset) {
      offset = offset - headerHeight - dateSelectorHeight / 2
      if (pinnedIds.length > 0) offset = offset - pinnedHeight
      div?.scrollTo({ left: 0, top: offset })
    }
  }

  let showFixed: boolean | undefined
  let selectedDate: Timestamp | undefined = messages ? getDay(messages[0].createOn) : undefined
  function handleScroll () {
    const upperVisible = getFirstVisible()
    if (upperVisible) {
      selectedDate = parseInt(upperVisible.id)
    }
  }

  const dateSelectorHeight = 30
  function getFirstVisible (): Element | undefined {
    if (!div) return

    const clientRect = div.getBoundingClientRect()
    const dateSelectors = div.getElementsByClassName('dateSelector')
    const firstVisible = Array.from(dateSelectors)
      .reverse()
      .find((child) => {
        if (child?.nodeType === Node.ELEMENT_NODE) {
          const rect = child?.getBoundingClientRect()
          if (rect.top - dateSelectorHeight / 2 <= clientRect.top + dateSelectorHeight) {
            return true
          }
        }
        return false
      })
    if (firstVisible) {
      showFixed = clientRect.top - firstVisible.getBoundingClientRect().top > -dateSelectorHeight / 2
    }
    return firstVisible
  }
</script>

<div class="flex-col vScroll" bind:this={div} on:scroll={handleScroll}>
  {#if showFixed}
    <div class="ml-2 pr-2 fixed">
      <JumpToDateSelector {selectedDate} fixed on:jumpToDate={handleJumpToDate} />
    </div>
  {/if}
  {#if messages}
    {#each messages as message, i (message._id)}
      {#if newMessagesPos === i}
        <ChannelSeparator title={chunter.string.New} line reverse isNew />
      {/if}
      {#if i === 0 || isOtherDay(message.createOn, messages[i - 1].createOn)}
        <JumpToDateSelector selectedDate={message.createOn} on:jumpToDate={handleJumpToDate} />
      {/if}
      <MessageComponent
        isHighlighted={$messageIdForScroll === message._id && $isMessageHighlighted}
        {message}
        {employees}
        on:openThread
        isPinned={pinnedIds.includes(message._id)}
        isSaved={savedMessagesIds.includes(message._id)}
        {savedAttachmentsIds}
      />
    {/each}
  {/if}
</div>

<style lang="scss">
  .fixed {
    position: absolute;
    align-self: center;
    z-index: 1;
  }
</style>
