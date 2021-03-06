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

import { Model, Builder } from '@anticrm/model'
import type { Resource } from '@anticrm/platform'
import { TClass, TDoc } from '@anticrm/model-core'

import type { ObjectDDParticipant, Trigger, TriggerFunc } from '@anticrm/server-core'
import core, { Class, Doc, DocumentQuery, DOMAIN_MODEL, FindOptions, FindResult, Hierarchy, Ref } from '@anticrm/core'
import serverCore from '@anticrm/server-core'

@Model(serverCore.class.Trigger, core.class.Doc, DOMAIN_MODEL)
export class TTrigger extends TDoc implements Trigger {
  trigger!: Resource<TriggerFunc>
}

@Model(serverCore.mixin.ObjectDDParticipant, core.class.Class)
export class TObjectDDParticipant extends TClass implements ObjectDDParticipant {
  collectDocs!: Resource<
  (
    doc: Doc,
    hiearachy: Hierarchy,
    findAll: <T extends Doc>(
      clazz: Ref<Class<T>>,
      query: DocumentQuery<T>,
      options?: FindOptions<T>
    ) => Promise<FindResult<T>>
  ) => Promise<Doc[]>
  >
}

export function createModel (builder: Builder): void {
  builder.createModel(TTrigger, TObjectDDParticipant)
}
