//
// Copyright © 2021 Anticrm Platform Contributors.
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

import type { KeysByType } from 'simplytyped'
import type { AttachedDoc, Class, Doc, Ref } from './classes'
import type { Tx } from './tx'

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type QuerySelector<T> = { // TODO: refactor this shit
  $in?: T[]
  $like?: string
  $regex?: string
  $options?: string
}

/**
 * @public
 */
export type ObjQueryType<T> = T | QuerySelector<T>

/**
 * @public
 */
export type DocumentQuery<T extends Doc> = {
  [P in keyof T]?: ObjQueryType<T[P]>
} & {
  $search?: string
  // support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
  [key: string]: any
}

/**
 * @public
 */
export type ToClassRef<T extends object> = {
  [P in keyof T]?: T[P] extends Ref<infer X> | null ? Ref<Class<X>> | [Ref<Class<X>>, Lookup<X>] : never
}

/**
 * @public
 */
export type RefKeys<T extends Doc> = Pick<T, KeysByType<T, NullableRef>>

/**
 * @public
 */
export type NullableRef = Ref<Doc> | null

/**
 * @public
 */
export type Refs<T extends Doc> = ToClassRef<RefKeys<T>>

/**
 * @public
 */
export interface ReverseLookups {
  _id?: ReverseLookup
}

/**
 * @public
 */
export interface ReverseLookup {
  [key: string]: Ref<Class<AttachedDoc>>
}

/**
 * @public
 */
export type Lookup<T extends Doc> = Refs<T> | ReverseLookups | (Refs<T> & ReverseLookups)

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type FindOptions<T extends Doc> = {
  limit?: number
  sort?: SortingQuery<T>
  lookup?: Lookup<T>
}

/**
 * @public
 */
export type SortingQuery<T extends Doc> = {
  [P in keyof T]?: SortingOrder
}

/**
 * @public
 */
export enum SortingOrder {
  Ascending = 1,
  Descending = -1
}

/**
 * @public
 */
export type RefsAsDocs<T> = {
  [P in keyof T]: T[P] extends Ref<infer X> | null ? (T extends X ? X : X | WithLookup<X>) : AttachedDoc[]
}

/**
 * @public
 */
export type LookupData<T extends Doc> = Partial<RefsAsDocs<T>>

/**
 * @public
 */
export type WithLookup<T extends Doc> = T & {
  $lookup?: LookupData<T>
}

/**
 * @public
 */
export type FindResult<T extends Doc> = WithLookup<T>[]

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TxResult {}

/**
 * @public
 */
export interface Storage {
  findAll: <T extends Doc>(
    _class: Ref<Class<T>>,
    query: DocumentQuery<T>,
    options?: FindOptions<T>
  ) => Promise<FindResult<T>>
  tx: (tx: Tx) => Promise<TxResult>
}
