<script lang="ts">
  import attachment from '@anticrm/attachment'
  import { FileBrowser } from '@anticrm/attachment-resources'
  import { Button } from '@anticrm/ui'
  import workbench from '@anticrm/workbench'
  import { SpaceBrowser } from '@anticrm/workbench-resources'
  import Header from './Header.svelte'
  import contact from '@anticrm/contact-resources/src/plugin'
  import { EmployeeBrowser } from '@anticrm/contact-resources'
  import { userSearch } from '../index'
  import plugin from '../plugin'
  import { SearchType } from '../utils'
  import MessagesBrowser from './MessagesBrowser.svelte'
  import { FilterButton } from '@anticrm/view-resources'

  let userSearch_: string = ''
  userSearch.subscribe((v) => (userSearch_ = v))

  let searchType: SearchType = SearchType.Messages

  const components = [
    { searchType: SearchType.Messages, component: MessagesBrowser, filterClass: plugin.class.ChunterMessage },
    {
      searchType: SearchType.Channels,
      component: SpaceBrowser,
      filterClass: plugin.class.Channel,
      props: {
        _class: plugin.class.Channel,
        label: plugin.string.ChannelBrowser,
        withFilterButton: false
      }
    },
    {
      searchType: SearchType.Files,
      component: FileBrowser,
      props: {
        requestedSpaceClasses: [plugin.class.Channel, plugin.class.DirectMessage]
      }
    },
    { searchType: SearchType.Contacts, component: EmployeeBrowser, filterClass: contact.class.Employee }
  ]
</script>

<div class="flex-col h-full">
  <div class="ac-header divide full">
    <Header icon={workbench.icon.Search} intlLabel={plugin.string.ChunterBrowser} />
  </div>
  <div class="h-full browser">
    <div class="pb-16 component">
      <div class="h-full">
        {#if components[searchType].component}
          <svelte:component
            this={components[searchType].component}
            withHeader={false}
            bind:search={userSearch_}
            {...components[searchType].props}
          />
        {/if}
      </div>
    </div>
    <div class="p-3 bar">
      <div class="w-32 flex-center"><FilterButton _class={components[searchType].filterClass} /></div>
      <div class="flex-center w-full mr-32 buttons">
        <div class="ml-1 p-1 btn">
          <Button
            label={plugin.string.Messages}
            selected={searchType === SearchType.Messages}
            kind="transparent"
            on:click={() => {
              searchType = SearchType.Messages
            }}
          />
        </div>
        <div class="ml-1 p-1 btn">
          <Button
            label={plugin.string.Channels}
            kind="transparent"
            selected={searchType === SearchType.Channels}
            on:click={() => {
              searchType = SearchType.Channels
            }}
          />
        </div>
        <div class="ml-1 p-1 btn">
          <Button
            label={attachment.string.Files}
            kind="transparent"
            selected={searchType === SearchType.Files}
            on:click={() => {
              searchType = SearchType.Files
            }}
          />
        </div>
        <div class="ml-1 p-1 btn">
          <Button
            kind="transparent"
            label={contact.string.Contacts}
            selected={searchType === SearchType.Contacts}
            on:click={() => {
              searchType = SearchType.Contacts
            }}
          />
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .browser {
    flex-grow: 2;
    display: flex;
    justify-content: flex-start;
    flex-direction: column-reverse;
  }

  .bar {
    flex-grow: 1;
    display: flex;
    justify-content: flex-start;
    max-height: 4rem;
  }

  .component {
    flex-grow: 2;
    height: 0;
  }
</style>
