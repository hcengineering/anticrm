import { Doc } from './classes'
import { SortingQuery } from './storage'

/**
 * @public
 */
export function resultSort<T extends Doc> (result: T[], sortOptions: SortingQuery<T>): void {
  const sortFunc = (a: any, b: any): number => {
    for (const key in sortOptions) {
      const result = typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]
      if (result !== 0) return result * (sortOptions[key] as number)
    }
    return 0
  }
  result.sort(sortFunc)
}
