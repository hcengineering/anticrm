//
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
//

import { Contact, Employee, formatName } from '@anticrm/contact'
import { Class, Client, Ref } from '@anticrm/core'
import { Resources } from '@anticrm/platform'
import { Avatar, getClient, MessageBox, ObjectSearchResult, UserInfo } from '@anticrm/presentation'
import { showPopup } from '@anticrm/ui'
import Channels from './components/Channels.svelte'
import ChannelsEditor from './components/ChannelsEditor.svelte'
import ChannelsPresenter from './components/ChannelsPresenter.svelte'
import ChannelsView from './components/ChannelsView.svelte'
import ChannelsDropdown from './components/ChannelsDropdown.svelte'
import ContactPresenter from './components/ContactPresenter.svelte'
import Contacts from './components/Contacts.svelte'
import CreateOrganization from './components/CreateOrganization.svelte'
import CreateOrganizations from './components/CreateOrganizations.svelte'
import CreatePerson from './components/CreatePerson.svelte'
import CreatePersons from './components/CreatePersons.svelte'
import EditOrganization from './components/EditOrganization.svelte'
import EditPerson from './components/EditPerson.svelte'
import OrganizationPresenter from './components/OrganizationPresenter.svelte'
import PersonPresenter from './components/PersonPresenter.svelte'
import SocialEditor from './components/SocialEditor.svelte'
import contact from './plugin'
import EmployeePresenter from './components/EmployeePresenter.svelte'
import EmployeeBrowser from './components/EmployeeBrowser.svelte'
import EmployeeAccountPresenter from './components/EmployeeAccountPresenter.svelte'
import OrganizationEditor from './components/OrganizationEditor.svelte'
import PersonEditor from './components/PersonEditor.svelte'
import OrganizationSelector from './components/OrganizationSelector.svelte'
import Members from './components/Members.svelte'
import MemberPresenter from './components/MemberPresenter.svelte'
import EditMember from './components/EditMember.svelte'
import EmployeeArrayEditor from './components/EmployeeArrayEditor.svelte'
import EmployeeEditor from './components/EmployeeEditor.svelte'
import CreateEmployee from './components/CreateEmployee.svelte'
import { leaveWorkspace } from '@anticrm/login-resources'

export {
  Channels,
  ChannelsEditor,
  ContactPresenter,
  ChannelsView,
  OrganizationSelector,
  ChannelsDropdown,
  EmployeePresenter,
  PersonPresenter,
  EmployeeBrowser,
  MemberPresenter,
  EmployeeEditor
}

async function queryContact (
  _class: Ref<Class<Contact>>,
  client: Client,
  search: string
): Promise<ObjectSearchResult[]> {
  return (await client.findAll(_class, { name: { $like: `%${search}%` } }, { limit: 200 })).map((e) => ({
    doc: e,
    title: formatName(e.name),
    icon: Avatar,
    iconProps: { size: 'x-small', avatar: e.avatar },
    component: UserInfo,
    componentProps: { size: 'x-small' }
  }))
}

async function kickEmployee (doc: Employee): Promise<void> {
  const client = getClient()
  const email = await client.findOne(contact.class.EmployeeAccount, { employee: doc._id })
  if (email === undefined) return
  showPopup(
    MessageBox,
    {
      label: contact.string.KickEmployee,
      message: contact.string.KickEmployeeDescr
    },
    undefined,
    (res?: boolean) => {
      if (res === true) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        leaveWorkspace(email.email)
      }
    }
  )
}

export default async (): Promise<Resources> => ({
  actionImpl: {
    KickEmployee: kickEmployee
  },
  component: {
    PersonEditor,
    OrganizationEditor,
    ContactPresenter,
    PersonPresenter,
    OrganizationPresenter,
    ChannelsPresenter,
    CreatePerson,
    CreateOrganization,
    EditPerson,
    EditOrganization,
    CreatePersons,
    CreateOrganizations,
    SocialEditor,
    Contacts,
    EmployeeAccountPresenter,
    EmployeePresenter,
    Members,
    MemberPresenter,
    EditMember,
    EmployeeArrayEditor,
    EmployeeEditor,
    CreateEmployee
  },
  completion: {
    EmployeeQuery: async (client: Client, query: string) => await queryContact(contact.class.Employee, client, query),
    PersonQuery: async (client: Client, query: string) => await queryContact(contact.class.Person, client, query),
    OrganizationQuery: async (client: Client, query: string) =>
      await queryContact(contact.class.Organization, client, query)
  }
})
