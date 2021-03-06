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

import { Builder } from '@anticrm/model'

import core from '@anticrm/core'
import inventory from '@anticrm/inventory'
import serverInventory from '@anticrm/server-inventory'
import view from '@anticrm/view'

export function createModel (builder: Builder): void {
  builder.mixin(inventory.class.Product, core.class.Class, view.mixin.HTMLPresenter, {
    presenter: serverInventory.function.ProductHTMLPresenter
  })

  builder.mixin(inventory.class.Product, core.class.Class, view.mixin.TextPresenter, {
    presenter: serverInventory.function.ProductTextPresenter
  })
}
