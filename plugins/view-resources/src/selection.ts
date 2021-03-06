import { Doc } from '@anticrm/core'
import { panelstore } from '@anticrm/ui'
import { onDestroy } from 'svelte'
import { writable } from 'svelte/store'

/**
 * @public
 *
 */
export type SelectDirection = 'vertical' | 'horizontal'

export interface SelectionFocusProvider {
  // -1 - previous
  // 0 - selec of as current
  // 1 - next
  // * If vertical, next will return item under.
  // * If horizontal, next will return item on right.
  // of - document offset from we requesting.
  select?: (offset: 1 | -1 | 0, of?: Doc, direction?: SelectDirection) => void

  // Update documents content
  update: (docs: Doc[]) => void

  // Return selection index from list of documents.
  current: (doc?: FocusSelection) => number | undefined

  // Update focused element, selection is not changed.
  updateFocus: (doc: Doc) => void

  // Update curent selection list, focus items it not updated.
  updateSelection: (docs: Doc[], value: boolean) => void

  // Return all selectable documents
  docs: () => Doc[]
}
/**
 * @public
 *
 * Define document selection inside platform.
 */
export interface FocusSelection {
  // Focused document
  focus?: Doc

  // Additional interface to select, next/prev etc.
  provider?: SelectionFocusProvider
}

/**
 * @public
 */
export const focusStore = writable<FocusSelection>({})
export const selectionStore = writable<Doc[]>([])

export const previewDocument = writable<Doc | undefined>()

panelstore.subscribe((val) => {
  previewDocument.set(undefined)
})
/**
 * @public
 */
export function updateFocus (selection?: FocusSelection): void {
  focusStore.update((cur) => {
    const now = Date.now()
    if (selection === undefined || now - ((cur as any).now ?? 0) >= 50) {
      cur.focus = selection?.focus
      cur.provider = selection?.provider
      ;(cur as any).now = now
      previewDocument.update((old) => {
        if (old !== undefined) {
          return selection?.focus
        }
      })
    }
    return cur
  })

  // We need to clear selection items not belong to passed provider.
  if (selection?.provider !== undefined) {
    const docs = new Set(selection?.provider.docs().map((it) => it._id))
    selectionStore.update((old) => {
      return old.filter((it) => docs.has(it._id))
    })
  }
}

/**
 * @public
 *
 * List selection provider
 */
export class ListSelectionProvider implements SelectionFocusProvider {
  _docs: Doc[] = []
  _current?: FocusSelection
  constructor (private readonly delegate: (offset: 1 | -1 | 0, of?: Doc, direction?: SelectDirection) => void) {
    const unsubscribe = focusStore.subscribe((doc) => {
      this._current = doc
    })
    onDestroy(() => {
      unsubscribe()
      updateFocus(undefined)
    })
  }

  select (offset: 1 | -1 | 0, of?: Doc, direction?: SelectDirection): void {
    this.delegate(offset, of, direction)
  }

  update (docs: Doc[]): void {
    this._docs = docs

    selectionStore.update((docs) => {
      const ids = new Set(docs.map((it) => it._id))
      return this._docs.filter((it) => ids.has(it._id))
    })

    if (this._docs.length > 0) {
      if (this._current?.focus === undefined) {
        this.delegate(0, undefined, 'vertical')
      } else {
        // Check if we don't have object, we need to select first one.
        this.delegate(0, this._current?.focus, 'vertical')
      }
      updateFocus({ focus: this._current?.focus, provider: this })
    }
  }

  docs (): Doc[] {
    return this._docs
  }

  updateFocus (doc: Doc): void {
    updateFocus({ focus: doc, provider: this })
  }

  updateSelection (docs: Doc[], value: boolean): void {
    selectionStore.update((selection) => {
      const docsSet = new Set(docs.map((it) => it._id))
      const noDocs = selection.filter((it) => !docsSet.has(it._id))
      return value ? [...noDocs, ...docs] : noDocs
    })
  }

  current (doc?: FocusSelection): number | undefined {
    return this._docs.findIndex((it) => it._id === doc?.focus?._id)
  }
}
