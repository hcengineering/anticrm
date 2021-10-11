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

import type { Doc, Ref, Class } from './classes'
import type { Storage } from './storage'

type Predicate = (docs: Doc[]) => Doc[]
type PredicateFactory = (pred: any, propertyKey: string, storage: Storage) => Promise<Predicate>

const predicates: Record<string, PredicateFactory> = {
  $in: async (o: any, propertyKey: string): Promise<Predicate> => {
    if (!Array.isArray(o)) {
      throw new Error('$in predicate requires array')
    }
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        if (o.includes((doc as any)[propertyKey])) result.push(doc)
      }
      return result
    }
  },

  $in_array: async (o: { $clazz: Ref<Class<Doc>>, $array: Ref<Doc>, $key: string }, propertyKey: string, storage: Storage): Promise<Predicate> => {
    const container = (await storage.findAll(o.$clazz, { _id: o.$array }))[0]
    if (container === undefined)
      return () => []

    const arr = (container as any)[o.$key] as Ref<Doc>[]
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        if (arr.includes((doc as any)[propertyKey])) result.push(doc)
      }

      const map = result.reduce((map, doc) => { map.set(doc._id, doc); return map }, new Map<Ref<Doc>, Doc>())
      return arr.map(id => map.get(id) as Doc)
    }
  },

  $like: async (query: string, propertyKey: string): Promise<Predicate> => {
    const searchString = query.split('%').join('.*')
    const regex = RegExp(`^${searchString}$`, 'i')
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        const value = (doc as any)[propertyKey] as string
        if (regex.test(value)) result.push(doc)
      }
      return result
    }
  },

  $regex: async (o: { $regex: string, $options: string }, propertyKey: string): Promise<Predicate> => {
    const re = new RegExp(o.$regex, o.$options)
    return (docs: Doc[]): Doc[] => {
      const result: Doc[] = []
      for (const doc of docs) {
        const value = (doc as any)[propertyKey] as string
        if (value.match(re) !== null) result.push(doc)
      }
      return result
    }
  }
}

export function isPredicate (o: Record<string, any>): boolean {
  if (o === null || typeof o !== 'object') { return false }
  const keys = Object.keys(o)
  return keys.length > 0 && keys.every((key) => key.startsWith('$'))
}

export async function createPredicates (o: Record<string, any>, propertyKey: string, storage: Storage): Promise<Predicate[]> {
  const keys = Object.keys(o)
  const result: Promise<Predicate>[] = []
  for (const key of keys) {
    const factory = predicates[key]
    if (factory === undefined) throw new Error('unknown predicate: ' + keys[0])
    result.push(factory(o[key], propertyKey, storage))
  }
  return Promise.all(result)
}
