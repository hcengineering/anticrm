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

import type { Ref, Space } from '@anticrm/core'
import { leadId } from '@anticrm/lead'
import lead from '@anticrm/lead-resources/src/plugin'
import type { IntlString } from '@anticrm/platform'
import { mergeIds } from '@anticrm/platform'
import { KanbanTemplate } from '@anticrm/task'
import type { AnyComponent } from '@anticrm/ui'
import { Action, ActionCategory, Viewlet } from '@anticrm/view'

export default mergeIds(leadId, lead, {
  string: {
    Funnel: '' as IntlString,
    Funnels: '' as IntlString,
    LeadApplication: '' as IntlString,
    Lead: '' as IntlString,
    Title: '' as IntlString,
    Assignee: '' as IntlString,
    ManageFunnelStatuses: '' as IntlString,
    FunnelBrowser: '' as IntlString,
    GotoLeadApplication: '' as IntlString
  },
  component: {
    CreateLead: '' as AnyComponent,
    EditLead: '' as AnyComponent,
    KanbanCard: '' as AnyComponent,
    LeadPresenter: '' as AnyComponent,
    TemplatesIcon: '' as AnyComponent,
    Leads: '' as AnyComponent,
    NewItemsHeader: '' as AnyComponent
  },
  space: {
    DefaultFunnel: '' as Ref<Space>
  },
  template: {
    DefaultFunnel: '' as Ref<KanbanTemplate>
  },
  viewlet: {
    TableCustomer: '' as Ref<Viewlet>,
    TableLead: '' as Ref<Viewlet>
  },
  category: {
    Lead: '' as Ref<ActionCategory>
  },
  action: {
    CreateGlobalLead: '' as Ref<Action>
  }
})
