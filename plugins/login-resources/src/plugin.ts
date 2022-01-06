/*!
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
*/

import type { StatusCode, IntlString } from '@anticrm/platform'
import { mergeIds } from '@anticrm/platform'

import login, { loginId } from '@anticrm/login'

export default mergeIds(loginId, login, {
  status: {
    RequiredField: '' as StatusCode<{ field: string }>,
    FieldsDoNotMatch: '' as StatusCode<{ field: string, field2: string }>,
    ConnectingToServer: '' as StatusCode,
    IncorrectValue: '' as StatusCode<{ field: string }>
  },
  string: {
    CreateWorkspace: '' as IntlString,
    HaveWorkspace: '' as IntlString,
    LastName: '' as IntlString,
    FirstName: '' as IntlString,
    HaveAccount: '' as IntlString,
    Join: '' as IntlString,
    Email: '' as IntlString,
    Password: '' as IntlString,
    PasswordRepeat: '' as IntlString,
    Workspace: '' as IntlString,
    LogIn: '' as IntlString,
    SignUp: '' as IntlString,
    SelectWorkspace: '' as IntlString,
    DoNotHaveAnAccount: '' as IntlString,
    Copy: '' as IntlString,
    Close: '' as IntlString,
    InviteDescription: '' as IntlString
  }
})
