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
  import attachment from '@anticrm/attachment'
  import contact, { Channel, ChannelProvider, combineName, findContacts, Person } from '@anticrm/contact'
  import { ChannelsDropdown } from '@anticrm/contact-resources'
  import PersonPresenter from '@anticrm/contact-resources/src/components/PersonPresenter.svelte'
  import { Account, AttachedData, Data, Doc, generateId, MixinData, Ref, TxProcessor, WithLookup } from '@anticrm/core'
  import login from '@anticrm/login'
  import { getMetadata, getResource, setPlatformStatus, unknownError } from '@anticrm/platform'
  import {
    Card,
    createQuery,
    EditableAvatar,
    getClient,
    getFileUrl,
    KeyedAttribute,
    PDFViewer
  } from '@anticrm/presentation'
  import type { Candidate } from '@anticrm/recruit'
  import { recognizeDocument } from '@anticrm/rekoni'
  import tags, { findTagCategory, TagElement, TagReference } from '@anticrm/tags'
  import {
    Button,
    Component,
    createFocusManager,
    EditBox,
    FocusHandler,
    getColorNumberByText,
    IconFile as FileIcon,
    IconInfo,
    Label,
    Link,
    showPopup,
    Spinner
  } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import recruit from '../plugin'
  import FileUpload from './icons/FileUpload.svelte'
  import YesNo from './YesNo.svelte'

  let firstName = ''
  let lastName = ''
  let createMore: boolean = false

  export function canClose (): boolean {
    return firstName === '' && lastName === '' && resume.uuid === undefined
  }

  let object: Candidate = {} as Candidate

  const resume = {} as {
    name: string
    uuid: string
    size: number
    type: string
    lastModified: number
  }

  const dispatch = createEventDispatcher()
  const client = getClient()
  let candidateId = generateId()

  let inputFile: HTMLInputElement
  let loading = false
  let dragover = false

  let avatar: File | undefined
  let channels: AttachedData<Channel>[] = []

  let matches: WithLookup<Person>[] = []
  let matchedChannels: AttachedData<Channel>[] = []

  let skills: TagReference[] = []
  const key: KeyedAttribute = {
    key: 'skills',
    attr: client.getHierarchy().getAttribute(recruit.mixin.Candidate, 'skills')
  }

  let elements = new Map<Ref<TagElement>, TagElement>()
  let namedElements = new Map<string, TagElement>()

  const newElements: TagElement[] = []

  const elementQuery = createQuery()
  let elementsPromise: Promise<void>
  $: elementsPromise = new Promise((resolve) => {
    elementQuery.query(tags.class.TagElement, {}, (result) => {
      const ne = new Map<Ref<TagElement>, TagElement>()
      const nne = new Map<string, TagElement>()
      for (const t of newElements.concat(result)) {
        ne.set(t._id, t)
        nne.set(t.title.trim().toLowerCase(), t)
      }
      elements = ne
      namedElements = nne
      resolve()
    })
  })

  async function createCandidate () {
    const candidate: Data<Person> = {
      name: combineName(firstName, lastName),
      city: object.city
    }
    if (avatar !== undefined) {
      const uploadFile = await getResource(attachment.helper.UploadFile)
      candidate.avatar = await uploadFile(avatar)
    }
    const candidateData: MixinData<Person, Candidate> = {
      title: object.title,
      onsite: object.onsite,
      remote: object.remote
    }

    const id = await client.createDoc(contact.class.Person, contact.space.Contacts, candidate, candidateId)
    await client.createMixin(
      id as Ref<Person>,
      contact.class.Person,
      contact.space.Contacts,
      recruit.mixin.Candidate,
      candidateData
    )

    if (resume.uuid !== undefined) {
      client.addCollection(
        attachment.class.Attachment,
        contact.space.Contacts,
        id,
        contact.class.Person,
        'attachments',
        {
          name: resume.name,
          file: resume.uuid,
          size: resume.size,
          type: resume.type,
          lastModified: resume.lastModified
        }
      )
    }
    for (const channel of channels) {
      await client.addCollection(
        contact.class.Channel,
        contact.space.Contacts,
        candidateId,
        contact.class.Person,
        'channels',
        {
          value: channel.value,
          provider: channel.provider
        }
      )
    }

    const categories = await client.findAll(tags.class.TagCategory, { targetClass: recruit.mixin.Candidate })
    // Tag elements
    const skillTagElements = new Map(
      (await client.findAll(tags.class.TagElement, { _id: { $in: skills.map((it) => it.tag) } })).map((it) => [
        it._id,
        it
      ])
    )
    for (const skill of skills) {
      // Create update tag if missing
      if (!skillTagElements.has(skill.tag)) {
        skill.tag = await client.createDoc(tags.class.TagElement, skill.space, {
          title: skill.title,
          color: skill.color,
          targetClass: recruit.mixin.Candidate,
          description: '',
          category: findTagCategory(skill.title, categories)
        })
      }
      await client.addCollection(skill._class, skill.space, candidateId, recruit.mixin.Candidate, 'skills', {
        title: skill.title,
        color: skill.color,
        tag: skill.tag
      })
    }

    if (createMore) {
      // Prepare for next
      object = {} as Candidate
      candidateId = generateId()
      avatar = undefined
      firstName = ''
      lastName = ''
      channels = []
    } else {
      dispatch('close', id)
    }
  }

  function isUndef (value?: string): boolean {
    return value === undefined || value === ''
  }

  function addChannel (channels: AttachedData<Channel>[], type: Ref<ChannelProvider>, value?: string): void {
    if (value !== undefined) {
      const provider = channels.find((e) => e.provider === type)
      if (provider === undefined) {
        channels.push({
          provider: type,
          value
        })
      } else {
        if (isUndef(provider.value)) {
          provider.value = value
        }
      }
    }
  }

  async function recognize (): Promise<void> {
    const token = getMetadata(login.metadata.LoginToken) ?? ''
    const fileUrl = window.location.origin + getFileUrl(resume.uuid)

    try {
      const doc = await recognizeDocument(token, fileUrl)

      if (isUndef(object.title) && doc.title !== undefined) {
        object.title = doc.title
      }

      if (isUndef(firstName) && doc.firstName !== undefined) {
        firstName = doc.firstName
      }

      if (isUndef(lastName) && doc.lastName !== undefined) {
        lastName = doc.lastName
      }

      if (isUndef(object.city) && doc.city !== undefined) {
        object.city = doc.city
      }

      if (isUndef(object.avatar ?? undefined) && doc.avatar !== undefined) {
        // We had avatar, let's try to upload it.
        const data = atob(doc.avatar)
        let n = data.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = data.charCodeAt(n)
        }
        avatar = new File([u8arr], doc.avatarName ?? 'avatar.png', { type: doc.avatarFormat ?? 'image/png' })
      }

      const newChannels = [...channels]
      addChannel(newChannels, contact.channelProvider.Email, doc.email)
      addChannel(newChannels, contact.channelProvider.GitHub, doc.github)
      addChannel(newChannels, contact.channelProvider.LinkedIn, doc.linkedin)
      addChannel(newChannels, contact.channelProvider.Phone, doc.phone)
      addChannel(newChannels, contact.channelProvider.Telegram, doc.telegram)
      addChannel(newChannels, contact.channelProvider.Twitter, doc.twitter)
      addChannel(newChannels, contact.channelProvider.Facebook, doc.facebook)
      channels = newChannels

      // Create skills
      await elementsPromise

      const categories = await client.findAll(tags.class.TagCategory, { targetClass: recruit.mixin.Candidate })
      const categoriesMap = new Map(Array.from(categories.map((it) => [it._id, it])))

      const newSkills: TagReference[] = []

      // Create missing tag elemnts
      for (const s of doc.skills ?? []) {
        const title = s.trim().toLowerCase()
        let e = namedElements.get(title)
        if (e === undefined) {
          // No yet tag with title
          const category = findTagCategory(s, categories)
          const cinstance = categoriesMap.get(category)
          e = TxProcessor.createDoc2Doc(
            client.txFactory.createTxCreateDoc(tags.class.TagElement, tags.space.Tags, {
              title,
              description: `Imported skill ${s} of ${cinstance?.label ?? ''}`,
              color: getColorNumberByText(s),
              targetClass: recruit.mixin.Candidate,
              category
            })
          )
          namedElements.set(title, e)
          elements.set(e._id, e)
          newElements.push(e)
        }
        newSkills.push(
          TxProcessor.createDoc2Doc(
            client.txFactory.createTxCreateDoc(tags.class.TagReference, tags.space.Tags, {
              title: e.title,
              color: e.color,
              tag: e._id,
              attachedTo: '' as Ref<Doc>,
              attachedToClass: recruit.mixin.Candidate,
              collection: 'skills'
            })
          )
        )
      }
      skills = [...skills, ...newSkills]
    } catch (err: any) {
      console.error(err)
    }
  }

  async function createAttachment (file: File) {
    loading = true
    try {
      const uploadFile = await getResource(attachment.helper.UploadFile)

      resume.uuid = await uploadFile(file, {
        space: contact.space.Contacts,
        attachedTo: candidateId
      })
      resume.name = file.name
      resume.size = file.size
      resume.type = file.type
      resume.lastModified = file.lastModified

      if (file.type.includes('application/pdf')) {
        await recognize()
      }
    } catch (err: any) {
      setPlatformStatus(unknownError(err))
    } finally {
      loading = false
    }
  }

  function drop (event: DragEvent) {
    dragover = false
    const droppedFile = event.dataTransfer?.files[0]
    if (droppedFile !== undefined) {
      createAttachment(droppedFile)
    }
  }

  function fileSelected () {
    console.log(inputFile.files)
    const file = inputFile.files?.[0]
    if (file !== undefined) {
      createAttachment(file)
    }
    manager.setFocusPos(102)
  }

  function onAvatarDone (e: any) {
    const { file } = e.detail

    avatar = file
  }

  function addTagRef (tag: TagElement): void {
    skills = [
      ...skills,
      {
        _class: tags.class.TagReference,
        _id: generateId() as Ref<TagReference>,
        attachedTo: '' as Ref<Doc>,
        attachedToClass: recruit.mixin.Candidate,
        collection: 'skills',
        space: tags.space.Tags,
        modifiedOn: 0,
        modifiedBy: '' as Ref<Account>,
        title: tag.title,
        tag: tag._id,
        color: tag.color
      }
    ]
  }

  $: findContacts(
    client,
    contact.class.Person,
    { ...object, name: combineName(firstName.trim(), lastName.trim()) },
    channels
  ).then((p) => {
    matches = p.contacts
    matchedChannels = p.channels
  })

  function removeAvatar (): void {
    avatar = undefined
  }

  const manager = createFocusManager()
</script>

<FocusHandler {manager} />

<Card
  label={recruit.string.CreateTalent}
  okAction={createCandidate}
  canSave={firstName.length > 0 && lastName.length > 0}
  on:close={() => {
    dispatch('close')
  }}
  bind:createMore
>
  <svelte:fragment slot="header">
    <Button
      icon={contact.icon.Person}
      label={contact.string.Person}
      size={'small'}
      kind={'no-border'}
      disabled
      on:click={() => {}}
    />
  </svelte:fragment>
  <div class="flex-between">
    <div class="flex-col">
      <EditBox
        placeholder={recruit.string.PersonFirstNamePlaceholder}
        bind:value={firstName}
        kind={'large-style'}
        maxWidth={'32rem'}
        focus
        focusIndex={1}
      />
      <EditBox
        placeholder={recruit.string.PersonLastNamePlaceholder}
        bind:value={lastName}
        kind={'large-style'}
        maxWidth={'32rem'}
        focusIndex={2}
      />
      <div class="mt-1">
        <EditBox
          placeholder={recruit.string.Title}
          bind:value={object.title}
          kind={'small-style'}
          maxWidth={'32rem'}
          focusIndex={3}
        />
      </div>
      <EditBox
        placeholder={recruit.string.Location}
        bind:value={object.city}
        kind={'small-style'}
        maxWidth={'32rem'}
        focusIndex={4}
      />
    </div>
    <div class="ml-4">
      <EditableAvatar
        bind:direct={avatar}
        avatar={object.avatar}
        size={'large'}
        on:remove={removeAvatar}
        on:done={onAvatarDone}
      />
    </div>
  </div>
  <svelte:fragment slot="pool">
    <ChannelsDropdown
      focusIndex={10}
      bind:value={channels}
      editable
      highlighted={matchedChannels.map((it) => it.provider)}
    />
    <YesNo
      focusIndex={100}
      label={recruit.string.Onsite}
      tooltip={recruit.string.WorkLocationPreferences}
      bind:value={object.onsite}
    />
    <YesNo
      focusIndex={101}
      label={recruit.string.Remote}
      tooltip={recruit.string.WorkLocationPreferences}
      bind:value={object.remote}
    />
    <Component
      is={tags.component.TagsDropdownEditor}
      props={{
        focusIndex: 102,
        items: skills,
        key,
        targetClass: recruit.mixin.Candidate,
        showTitle: false,
        elements,
        newElements,
        countLabel: recruit.string.NumberSkills
      }}
      on:open={(evt) => {
        addTagRef(evt.detail)
      }}
      on:delete={(evt) => {
        skills = skills.filter((it) => it._id !== evt.detail)
      }}
    />
  </svelte:fragment>
  <svelte:fragment slot="footer">
    <div
      class="flex-center resume"
      class:solid={dragover || resume.uuid}
      on:dragover|preventDefault={() => {
        dragover = true
      }}
      on:dragleave={() => {
        dragover = false
      }}
      on:drop|preventDefault|stopPropagation={drop}
    >
      {#if resume.uuid}
        <Button
          kind={'transparent'}
          focusIndex={103}
          icon={FileIcon}
          on:click={() => {
            showPopup(PDFViewer, { file: resume.uuid, name: resume.name }, 'float')
          }}
        >
          <svelte:fragment slot="content">
            <span class="overflow-label disabled">{resume.name}</span>
          </svelte:fragment>
        </Button>
      {:else}
        {#if loading}
          <Link label={'Uploading...'} icon={Spinner} disabled />
        {:else}
          <Button
            kind={'transparent'}
            focusIndex={103}
            label={recruit.string.AddDropHere}
            icon={FileUpload}
            on:click={() => {
              inputFile.click()
            }}
          />
        {/if}
        <input bind:this={inputFile} type="file" name="file" id="file" style="display: none" on:change={fileSelected} />
      {/if}
    </div>
    {#if matches.length > 0}
      <div class="flex-col-stretch flex-grow error-color">
        <div class="flex mb-1">
          <IconInfo size={'medium'} />
          <span class="text-sm overflow-label ml-2">
            <Label label={contact.string.PersonAlreadyExists} />
          </span>
        </div>
        <PersonPresenter value={matches[0]} avatarSize={'tiny'} />
      </div>
    {/if}
  </svelte:fragment>
</Card>

<style lang="scss">
  .resume {
    padding: 0.5rem 0.75rem;
    background: var(--accent-bg-color);
    border: 1px dashed var(--divider-color);
    border-radius: 0.5rem;

    &.solid {
      border-style: solid;
    }
  }
</style>
