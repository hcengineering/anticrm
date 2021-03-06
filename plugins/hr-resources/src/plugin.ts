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

import hr, { hrId } from '@anticrm/hr'
import { IntlString, mergeIds } from '@anticrm/platform'

export default mergeIds(hrId, hr, {
  string: {
    Department: '' as IntlString,
    ParentDepartmentLabel: '' as IntlString,
    Structure: '' as IntlString,
    CreateDepartment: '' as IntlString,
    CreateDepartmentLabel: '' as IntlString,
    DepartmentPlaceholder: '' as IntlString,
    TeamLead: '' as IntlString,
    UnAssignLead: '' as IntlString,
    MemberCount: '' as IntlString,
    AssignLead: '' as IntlString,
    TeamLeadTooltip: '' as IntlString,
    MoveStaff: '' as IntlString,
    MoveStaffDescr: '' as IntlString,
    AddEmployee: '' as IntlString,
    RequestType: '' as IntlString,
    Schedule: '' as IntlString,
    EditRequest: '' as IntlString,
    CreateRequest: '' as IntlString,
    Today: '' as IntlString,
    NoEmployeesInDepartment: '' as IntlString,
    Staff: '' as IntlString,
    Members: '' as IntlString,
    NoMembers: '' as IntlString,
    AddMember: '' as IntlString
  }
})
