//
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
//

import { Ref } from '@anticrm/core'
import { hrId } from '@anticrm/hr'
import hr from '@anticrm/hr-resources/src/plugin'
import { IntlString, mergeIds } from '@anticrm/platform'
import { AnyComponent } from '@anticrm/ui'
import { Action, ActionCategory } from '@anticrm/view'

export default mergeIds(hrId, hr, {
  string: {
    HRApplication: '' as IntlString,
    Departments: '' as IntlString,
    Request: '' as IntlString,
    Vacation: '' as IntlString,
    Sick: '' as IntlString,
    PTO: '' as IntlString,
    PTO2: '' as IntlString,
    Remote: '' as IntlString,
    Overtime: '' as IntlString,
    Overtime2: '' as IntlString
  },
  component: {
    Structure: '' as AnyComponent,
    EditDepartment: '' as AnyComponent,
    DepartmentStaff: '' as AnyComponent,
    DepartmentEditor: '' as AnyComponent,
    Schedule: '' as AnyComponent,
    EditRequest: '' as AnyComponent,
    TzDatePresenter: '' as AnyComponent,
    TzDateEditor: '' as AnyComponent,
    RequestPresenter: '' as AnyComponent
  },
  category: {
    HR: '' as Ref<ActionCategory>
  },
  action: {
    EditDepartment: '' as Ref<Action>,
    DeleteDepartment: '' as Ref<Action>,
    EditRequest: '' as Ref<Action>,
    DeleteRequest: '' as Ref<Action>
  }
})
