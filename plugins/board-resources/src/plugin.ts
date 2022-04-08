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

import board, { boardId } from '@anticrm/board'
import { IntlString, mergeIds } from '@anticrm/platform'
import type { AnyComponent } from '@anticrm/ui'

export default mergeIds(boardId, board, {
  string: {
    BoardName: '' as IntlString,
    MakePrivate: '' as IntlString,
    MakePrivateDescription: '' as IntlString,
    CreateBoard: '' as IntlString,
    CardName: '' as IntlString,
    More: '' as IntlString,
    SelectBoard: '' as IntlString,
    CreateCard: '' as IntlString,
    CardCreateLabel: '' as IntlString,
    Customer: '' as IntlString,
    Cards: '' as IntlString,
    NoCardsForDocument: '' as IntlString,
    CardPlaceholder: '' as IntlString,
    Board: '' as IntlString,
    Boards: '' as IntlString,
    MyBoards: '' as IntlString,
    BoardApplication: '' as IntlString,
    Card: '' as IntlString,
    Title: '' as IntlString,
    Assignee: '' as IntlString,
    ManageBoardStatuses: '' as IntlString,
    Description: '' as IntlString,
    DescriptionPlaceholder: '' as IntlString,
    Location: '' as IntlString,
    Members: '' as IntlString,
    IsArchived: '' as IntlString,
    BoardCreateLabel: '' as IntlString,
    Settings: '' as IntlString,
    InList: '' as IntlString,
    AddToCard: '' as IntlString,
    Labels: '' as IntlString,
    Checklist: '' as IntlString,
    Dates: '' as IntlString,
    Attachments: '' as IntlString,
    CustomFields: '' as IntlString,
    Automation: '' as IntlString,
    AddButton: '' as IntlString,
    Actions: '' as IntlString,
    Move: '' as IntlString,
    Copy: '' as IntlString,
    MakeTemplate: '' as IntlString,
    Watch: '' as IntlString,
    Archive: '' as IntlString,
    HideDetails: '' as IntlString,
    ShowDetails: '' as IntlString,
    NewList: '' as IntlString,
    AddList: '' as IntlString,
    NewListPlaceholder: '' as IntlString
  },
  component: {
    CreateCustomer: '' as AnyComponent,
    CardsPresenter: '' as AnyComponent,
    Boards: '' as AnyComponent,
    EditCard: '' as AnyComponent,
    Members: '' as AnyComponent,
    Settings: '' as AnyComponent
  }
})
