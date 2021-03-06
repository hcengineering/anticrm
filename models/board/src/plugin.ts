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

import { boardId } from '@anticrm/board'
import board from '@anticrm/board-resources/src/plugin'
import type { Ref, Space } from '@anticrm/core'
import { IntlString, mergeIds } from '@anticrm/platform'
import { KanbanTemplate, Sequence } from '@anticrm/task'
import type { AnyComponent } from '@anticrm/ui'
import { Action, ViewAction, ViewletDescriptor } from '@anticrm/view'

export default mergeIds(boardId, board, {
  component: {
    CreateBoard: '' as AnyComponent,
    LabelsView: '' as AnyComponent,
    CreateCard: '' as AnyComponent,
    KanbanCard: '' as AnyComponent,
    CardPresenter: '' as AnyComponent,
    BoardPresenter: '' as AnyComponent,
    TemplatesIcon: '' as AnyComponent,
    Cards: '' as AnyComponent,
    KanbanView: '' as AnyComponent,
    TableView: '' as AnyComponent,
    DatesActionPopup: '' as AnyComponent,
    CoverActionPopup: '' as AnyComponent,
    MoveActionPopup: '' as AnyComponent,
    CopyActionPopup: '' as AnyComponent,
    CardCoverPresenter: '' as AnyComponent,
    CardCoverEditor: '' as AnyComponent
  },
  space: {
    DefaultBoard: '' as Ref<Space>
  },
  template: {
    DefaultBoard: '' as Ref<KanbanTemplate>
  },
  ids: {
    Sequence: '' as Ref<Sequence>
  },
  viewlet: {
    Kanban: '' as Ref<ViewletDescriptor>,
    Table: '' as Ref<ViewletDescriptor>
  },
  string: {
    CommonBoardPreference: '' as IntlString,
    ConvertToCard: '' as IntlString
  },
  action: {
    ConvertToCard: '' as Ref<Action>
  },
  actionImpl: {
    ConvertToCard: '' as ViewAction
  }
})
