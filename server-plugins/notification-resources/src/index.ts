//
// Copyright © 2020, 2021 Anticrm Platform Contributors.
// Copyright © 2021, 2022 Hardcore Engineering Inc.
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

import chunter, { Backlink } from '@anticrm/chunter'
import contact, { Employee, EmployeeAccount, formatName } from '@anticrm/contact'
import core, {
  Account,
  AttachedDoc,
  Class,
  Data,
  Doc,
  generateId,
  Hierarchy,
  Obj,
  Ref,
  Space,
  Timestamp,
  Tx,
  TxCollectionCUD,
  TxCreateDoc,
  TxCUD,
  TxProcessor
} from '@anticrm/core'
import notification, {
  EmailNotification,
  Notification,
  NotificationProvider,
  NotificationStatus
} from '@anticrm/notification'
import { getResource } from '@anticrm/platform'
import type { TriggerControl } from '@anticrm/server-core'
import { extractTx } from '@anticrm/server-core'
import { createLastViewTx, getUpdateLastViewTx } from '@anticrm/server-notification'
import view, { HTMLPresenter, TextPresenter } from '@anticrm/view'

/**
 * @public
 */
export async function OnBacklinkCreate (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const hierarchy = control.hierarchy
  const ptx = tx as TxCollectionCUD<Doc, Backlink>

  if (!checkTx(ptx, hierarchy)) return []

  const result: Tx[] = []

  const receiver = await getReceiver(ptx, control)
  if (receiver === undefined) return []
  const sender = await getSender(ptx, control)
  const backlink = getBacklink(ptx)
  const doc = await getBacklinkDoc(backlink, control)
  const textPart = doc !== undefined ? await getTextPart(doc, hierarchy) : undefined
  const htmlPart = doc !== undefined ? await getHtmlPart(doc, hierarchy) : undefined

  const createNotificationTx = await getPlatformNotificationTx(ptx, backlink, textPart, sender)

  if (createNotificationTx !== undefined) {
    result.push(createNotificationTx)
  }

  if (
    sender !== undefined &&
    textPart !== undefined &&
    (await isAllowed(control, receiver, notification.ids.EmailNotification))
  ) {
    const emailTx = await getEmailTx(ptx, backlink, sender, textPart, htmlPart, receiver)
    if (emailTx !== undefined) {
      result.push(emailTx)
    }
  }
  return result
}

function checkTx (ptx: TxCollectionCUD<Doc, Backlink>, hierarchy: Hierarchy): boolean {
  if (ptx._class !== core.class.TxCollectionCUD) {
    return false
  }

  if (
    ptx.tx._class !== core.class.TxCreateDoc ||
    !hierarchy.isDerived(ptx.tx.objectClass, chunter.class.Backlink) ||
    !hierarchy.isDerived(ptx.objectClass, contact.class.Employee)
  ) {
    return false
  }
  return true
}

async function getUpdateLastViewTxes (
  doc: Doc,
  _id: Ref<Doc>,
  _class: Ref<Class<Doc>>,
  modifiedOn: Timestamp,
  user: Ref<Account>,
  control: TriggerControl
): Promise<Tx[]> {
  const updatedUsers: Set<Ref<Account>> = new Set<Ref<Account>>()
  const result: Tx[] = []
  const tx = await getUpdateLastViewTx(control.findAll, _id, _class, modifiedOn, user)
  if (tx !== undefined) {
    updatedUsers.add(user)
    result.push(tx)
  }
  const docClass = control.hierarchy.getClass(doc._class)
  const anotherUserNotifications = control.hierarchy.as(docClass, notification.mixin.AnotherUserNotifications)
  for (const field of anotherUserNotifications?.fields ?? []) {
    const value = (doc as any)[field]
    if (value != null) {
      for (const employeeId of Array.isArray(value) ? value : [value]) {
        const account = (await control.modelDb.findAll(core.class.Account, { employee: employeeId }, { limit: 1 }))[0]
        if (account !== undefined) {
          if (updatedUsers.has(account._id)) continue
          const assigneeTx = await createLastViewTx(control.findAll, _id, _class, account._id)
          if (assigneeTx !== undefined) {
            updatedUsers.add(account._id)
            result.push(assigneeTx)
          }
        }
      }
    }
  }
  return result
}

/**
 * @public
 */
export async function UpdateLastView (tx: Tx, control: TriggerControl): Promise<Tx[]> {
  const actualTx = extractTx(tx)
  if (![core.class.TxUpdateDoc, core.class.TxCreateDoc, core.class.TxMixin].includes(actualTx._class)) {
    return []
  }

  const result: Tx[] = []

  switch (actualTx._class) {
    case core.class.TxCreateDoc: {
      const createTx = actualTx as TxCreateDoc<Doc>
      if (control.hierarchy.isDerived(createTx.objectClass, notification.class.LastView)) {
        return []
      }
      if (control.hierarchy.isDerived(createTx.objectClass, core.class.AttachedDoc)) {
        const doc = TxProcessor.createDoc2Doc(createTx as TxCreateDoc<AttachedDoc>)
        const attachedTxes = await getUpdateLastViewTxes(
          doc,
          doc.attachedTo,
          doc.attachedToClass,
          createTx.modifiedOn,
          createTx.modifiedBy,
          control
        )
        const docClass = control.hierarchy.getClass(doc._class)
        if (!control.hierarchy.hasMixin(docClass, notification.mixin.LastViewAttached)) return attachedTxes
        const parentTxes = await getUpdateLastViewTxes(
          doc,
          doc._id,
          doc._class,
          createTx.modifiedOn,
          createTx.modifiedBy,
          control
        )
        return [...attachedTxes, ...parentTxes]
      } else {
        const doc = TxProcessor.createDoc2Doc(createTx)
        return await getUpdateLastViewTxes(doc, doc._id, doc._class, createTx.modifiedOn, createTx.modifiedBy, control)
      }
    }
    case core.class.TxUpdateDoc:
    case core.class.TxMixin: {
      const tx = actualTx as TxCUD<Doc>
      const doc = (await control.findAll(tx.objectClass, { _id: tx.objectId }, { limit: 1 }))[0]
      if (doc !== undefined) {
        return await getUpdateLastViewTxes(doc, doc._id, doc._class, tx.modifiedOn, tx.modifiedBy, control)
      }
      break
    }
    default:
      break
  }

  return result
}

async function getReceiver (
  ptx: TxCollectionCUD<Doc, Backlink>,
  control: TriggerControl
): Promise<EmployeeAccount | undefined> {
  return (
    await control.modelDb.findAll(
      contact.class.EmployeeAccount,
      {
        employee: ptx.objectId as Ref<Employee>
      },
      { limit: 1 }
    )
  )[0]
}

async function isAllowed (
  control: TriggerControl,
  receiver: EmployeeAccount,
  providerId: Ref<NotificationProvider>
): Promise<boolean> {
  const setting = (
    await control.findAll(
      notification.class.NotificationSetting,
      {
        provider: providerId,
        type: notification.ids.MentionNotification,
        space: receiver._id as unknown as Ref<Space>
      },
      { limit: 1 }
    )
  )[0]
  if (setting !== undefined) {
    return setting.enabled
  }
  const provider = (
    await control.modelDb.findAll(notification.class.NotificationProvider, {
      _id: providerId
    })
  )[0]
  if (provider === undefined) return false
  return provider.default
}

async function getPlatformNotificationTx (
  ptx: TxCollectionCUD<Doc, Backlink>,
  backlink: Backlink,
  textPart: string | undefined,
  sender: string | undefined
): Promise<TxCollectionCUD<Doc, Notification> | undefined> {
  const createTx: TxCreateDoc<Notification> = {
    objectClass: notification.class.Notification,
    objectSpace: notification.space.Notifications,
    objectId: generateId(),
    modifiedOn: ptx.modifiedOn,
    modifiedBy: ptx.modifiedBy,
    space: ptx.space,
    _id: generateId(),
    _class: core.class.TxCreateDoc,
    attributes: {
      tx: ptx._id,
      status: NotificationStatus.New,
      type: notification.ids.MentionNotification
    } as unknown as Data<Notification>
  }

  if (sender !== undefined && textPart !== undefined) {
    const text = `${sender} mentioned you in ${textPart} ${backlink.message}`
    createTx.attributes.text = text
  }

  const createNotificationTx: TxCollectionCUD<Doc, Notification> = {
    ...ptx,
    _id: generateId(),
    collection: 'notifications',
    tx: createTx
  }

  return createNotificationTx
}

function getBacklink (ptx: TxCollectionCUD<Doc, Backlink>): Backlink {
  return TxProcessor.createDoc2Doc(ptx.tx as TxCreateDoc<Backlink>)
}

async function getBacklinkDoc (backlink: Backlink, control: TriggerControl): Promise<Doc | undefined> {
  return (
    await control.findAll(
      backlink.backlinkClass,
      {
        _id: backlink.backlinkId
      },
      { limit: 1 }
    )
  )[0]
}

async function getTextPart (doc: Doc, hierarchy: Hierarchy): Promise<string | undefined> {
  const TextPresenter = getTextPresenter(doc._class, hierarchy)
  if (TextPresenter === undefined) return
  return (await getResource(TextPresenter.presenter))(doc)
}

async function getHtmlPart (doc: Doc, hierarchy: Hierarchy): Promise<string | undefined> {
  const HTMLPresenter = getHTMLPresenter(doc._class, hierarchy)
  const htmlPart = HTMLPresenter !== undefined ? (await getResource(HTMLPresenter.presenter))(doc) : undefined
  return htmlPart
}

async function getSender (ptx: TxCollectionCUD<Doc, Backlink>, control: TriggerControl): Promise<string | undefined> {
  const account = (
    await control.modelDb.findAll(
      contact.class.EmployeeAccount,
      {
        _id: ptx.modifiedBy as Ref<EmployeeAccount>
      },
      { limit: 1 }
    )
  )[0]
  if (account === undefined) return undefined

  return formatName(account.name)
}

async function getEmailTx (
  ptx: TxCollectionCUD<Doc, Backlink>,
  backlink: Backlink,
  sender: string,
  textPart: string,
  htmlPart: string | undefined,
  receiver: EmployeeAccount
): Promise<TxCreateDoc<EmailNotification> | undefined> {
  const html = `<p><b>${sender}</b> mentioned you in ${htmlPart !== undefined ? htmlPart : textPart}</p> ${
    backlink.message
  }`
  const text = `${sender} mentioned you in ${textPart}`
  return {
    _id: generateId(),
    objectId: generateId(),
    _class: core.class.TxCreateDoc,
    space: core.space.DerivedTx,
    objectClass: notification.class.EmailNotification,
    objectSpace: notification.space.Notifications,
    modifiedOn: ptx.modifiedOn,
    modifiedBy: ptx.modifiedBy,
    attributes: {
      status: 'new',
      sender,
      receivers: [receiver.email],
      subject: `You was mentioned in ${textPart}`,
      text,
      html
    }
  }
}

function getHTMLPresenter (_class: Ref<Class<Doc>>, hierarchy: Hierarchy): HTMLPresenter | undefined {
  let clazz: Ref<Class<Obj>> | undefined = _class
  while (clazz !== undefined) {
    const _class = hierarchy.getClass(clazz)
    const presenter = hierarchy.as(_class, view.mixin.HTMLPresenter)
    if (presenter.presenter != null) return presenter
    clazz = _class.extends
  }
}

function getTextPresenter (_class: Ref<Class<Doc>>, hierarchy: Hierarchy): TextPresenter | undefined {
  let clazz: Ref<Class<Obj>> | undefined = _class
  while (clazz !== undefined) {
    const _class = hierarchy.getClass(clazz)
    const presenter = hierarchy.as(_class, view.mixin.TextPresenter)
    if (presenter.presenter != null) return presenter
    clazz = _class.extends
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  trigger: {
    OnBacklinkCreate,
    UpdateLastView
  }
})
