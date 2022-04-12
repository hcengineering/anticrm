//
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
//

import chunter, { chunterId } from '@anticrm/chunter'
import { Doc } from '@anticrm/core'
import type { IntlString, Resource } from '@anticrm/platform'
import { mergeIds } from '@anticrm/platform'
import type { AnyComponent } from '@anticrm/ui'

export default mergeIds(chunterId, chunter, {
  component: {
    CreateChannel: '' as AnyComponent,
    ChannelHeader: '' as AnyComponent,
    ChannelView: '' as AnyComponent,
    EditChannel: '' as AnyComponent
  },
  actionImpl: {
    SubscribeMessage: '' as Resource<(object: Doc) => Promise<void>>,
    SubscribeComment: '' as Resource<(object: Doc) => Promise<void>>,
    UnsubscribeMessage: '' as Resource<(object: Doc) => Promise<void>>,
    UnsubscribeComment: '' as Resource<(object: Doc) => Promise<void>>,
    PinMessage: '' as Resource<(object: Doc) => Promise<void>>,
    UnpinMessage: '' as Resource<(object: Doc) => Promise<void>>
  },
  string: {
    Channel: '' as IntlString,
    Channels: '' as IntlString,
    CreateChannel: '' as IntlString,
    ChannelName: '' as IntlString,
    ChannelNamePlaceholder: '' as IntlString,
    ChannelDescription: '' as IntlString,
    MakePrivate: '' as IntlString,
    MakePrivateDescription: '' as IntlString,
    Members: '' as IntlString,
    In: '' as IntlString,
    Replies: '' as IntlString,
    Topic: '' as IntlString,
    Thread: '' as IntlString,
    Threads: '' as IntlString,
    RepliesCount: '' as IntlString,
    LastReply: '' as IntlString,
    New: '' as IntlString,
    GetNewReplies: '' as IntlString,
    TurnOffReplies: '' as IntlString,
    PinMessage: '' as IntlString,
    UnpinMessage: '' as IntlString,
    Pinned: '' as IntlString,
    DeleteMessage: '' as IntlString,
    EditMessage: '' as IntlString
  }
})
