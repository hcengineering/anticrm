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

import { IntlString, mergeIds } from '@anticrm/platform'

import gmail, { gmailId } from '@anticrm/gmail'

export default mergeIds(gmailId, gmail, {
  string: {
    From: '' as IntlString,
    To: '' as IntlString,
    Copy: '' as IntlString,
    MessagesSelected: '' as IntlString,
    PublishSelected: '' as IntlString,
    YouAnd: '' as IntlString,
    CreateMessage: '' as IntlString,
    ShareMessages: '' as IntlString,
    Connect: '' as IntlString,
    RedirectGoogle: '' as IntlString,
    ConnectGmai: '' as IntlString,
    Reply: '' as IntlString,
    Subject: '' as IntlString,
    Send: '' as IntlString,
    NewMessage: '' as IntlString,
    NewMessageTo: '' as IntlString,
    Cancel: '' as IntlString,
    SubjectPlaceholder: '' as IntlString,
    CopyPlaceholder: '' as IntlString
  }
})
