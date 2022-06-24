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

import { Resources } from '@anticrm/platform'
import DepartmentEditor from './components/DepartmentEditor.svelte'
import DepartmentStaff from './components/DepartmentStaff.svelte'
import EditDepartment from './components/EditDepartment.svelte'
import EditRequest from './components/EditRequest.svelte'
import Schedule from './components/Schedule.svelte'
import Structure from './components/Structure.svelte'

export default async (): Promise<Resources> => ({
  component: {
    Structure,
    EditDepartment,
    DepartmentStaff,
    DepartmentEditor,
    Schedule,
    EditRequest
  }
})
