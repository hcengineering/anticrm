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

import type { IntlString, Asset } from '@anticrm/platform'

/**
 * @public
 */
export type Ref<T extends Doc> = string & { __ref: T }

/**
 * @public
 */
export type PrimitiveType = number | string | boolean | undefined | Ref<Doc>

/**
 * @public
 */
export type Timestamp = number

/**
 * @public
 */
export type Markup = string

/**
 * @public
 */
export interface Obj {
  _class: Ref<Class<this>>
}

/**
 * @public
 */
export interface Doc extends Obj {
  _id: Ref<this>
  space: Ref<Space>
  modifiedOn: Timestamp
  modifiedBy: Ref<Account>
}

/**
 * @public
 */
export type PropertyType = any

/**
 * @public
 */
export interface UXObject extends Obj {
  label: IntlString
  icon?: Asset
  hidden?: boolean
}

/**
 * @public
 */
export interface AttachedDoc extends Doc {
  attachedTo: Ref<Doc>
  attachedToClass: Ref<Class<Doc>>
  collection: string
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Type<T extends PropertyType> extends UXObject {}

/**
 * @public
 */
export enum IndexKind {
  FullText,
  Indexed
}

/**
 * @public
 */
export interface Enum extends Doc {
  name: string
  enumValues: string[]
}

/**
 * @public
 */
export interface Attribute<T extends PropertyType> extends Doc, UXObject {
  attributeOf: Ref<Class<Obj>>
  name: string
  type: Type<T>
  index?: IndexKind
  shortLabel?: IntlString
  isCustom?: boolean
}

/**
 * @public
 */
export type AnyAttribute = Attribute<Type<any>>

/**
 * @public
 */
export enum ClassifierKind {
  CLASS,
  INTERFACE,
  MIXIN
}

/**
 * @public
 */
export interface Classifier extends Doc, UXObject {
  kind: ClassifierKind
}

/**
 * @public
 */
export type Domain = string & { __domain: true }

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Interface<T extends Doc> extends Classifier {
  extends?: Ref<Interface<Doc>>[]
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Class<T extends Obj> extends Classifier {
  extends?: Ref<Class<Obj>>
  implements?: Ref<Interface<Doc>>[]
  domain?: Domain
  shortLabel?: IntlString
  sortingKey?: string
}

/**
 * @public
 * Define a set of plugin to model document bindings.
 */
export interface PluginConfiguration extends Doc {
  pluginId: string
  transactions: Ref<Doc>[]
}

/**
 * @public
 */
export type Mixin<T extends Doc> = Class<T>

// D A T A

/**
 * @public
 */
export type Data<T extends Doc> = Omit<T, keyof Doc>

/**
 * @public
 */
export type AttachedData<T extends AttachedDoc> = Omit<T, keyof AttachedDoc>

// T Y P E S

/**
 * @public
 */

export interface TypeDate extends Type<Date> {
  // If not set to true, will be false
  withTime?: boolean
}

/**
 * @public
 */
export interface RefTo<T extends Doc> extends Type<Ref<Class<T>>> {
  to: Ref<Class<T>>
}

/**
 * @public
 */
export interface Collection<T extends AttachedDoc> extends Type<number> {
  of: Ref<Class<T>>
  itemLabel?: IntlString
}

/**
 * @public
 */
export type Bag<T extends PropertyType> = Record<string, T>

/**
 * @public
 */
export interface BagOf<T extends PropertyType> extends Type<Bag<T>> {
  of: Type<T>
}

/**
 * @public
 */
export type Arr<T extends PropertyType> = T[]

/**
 * @public
 */
export interface ArrOf<T extends PropertyType> extends Type<T[]> {
  of: Type<T>
}

/**
 * @public
 */
export interface EnumOf extends Type<string> {
  of: Ref<Enum>
}

/**
 * @public
 */
export const DOMAIN_MODEL = 'model' as Domain

/**
 * @public
 */
export const DOMAIN_TRANSIENT = 'transient' as Domain

/**
 * Special domain to access s3 blob data.
 * @public
 */
export const DOMAIN_BLOB = 'blob' as Domain

/**
 * Special domain to access s3 blob data.
 * @public
 */
export const DOMAIN_FULLTEXT_BLOB = 'fulltext-blob' as Domain

// S P A C E

/**
 * @public
 */
export interface Space extends Doc {
  name: string
  description: string
  private: boolean
  members: Arr<Ref<Account>>
  archived: boolean
}

/**
 * @public
 */
export interface Account extends Doc {
  email: string
  role: AccountRole
}

/**
 * @public
 */
export enum AccountRole {
  User,
  Maintainer,
  Owner
}

/**
 * @public
 */
export interface UserStatus extends Doc {
  online: boolean
}

/**
 * @public
 */
export interface Version extends Doc {
  major: number
  minor: number
  patch: number
}

/**
 * Blob data from s3 storage
 * @public
 */
export interface BlobData extends Doc {
  name: string
  size: number
  type: string
  base64Data: string // base64 encoded data
}

/**
 * Blob data from s3 storage
 * @public
 */
export interface FullTextData extends Doc {
  data: any
}
