<script lang="ts">
  import { Class, Doc, DocumentQuery, FindOptions, Hierarchy, Ref } from '@anticrm/core'
  import { Asset, IntlString } from '@anticrm/platform'
  import { getClient, ObjectPopup, updateAttribute } from '@anticrm/presentation'
  import { Label, SelectPopup } from '@anticrm/ui'
  import { createEventDispatcher } from 'svelte'
  import view from '../plugin'
  import ObjectPresenter from './ObjectPresenter.svelte'

  export let value: Doc | Doc[]
  export let isEditable: boolean = true

  export let _class: Ref<Class<Doc>> | undefined
  export let query: DocumentQuery<Doc> | undefined
  export let queryOptions: FindOptions<Doc> | undefined

  export let attribute: string
  export let searchField: string
  export let values:
    | {
        icon?: Asset
        label: IntlString
        id: string | number
      }[]
    | undefined = undefined

  export let fillQuery: Record<string, string> | undefined
  export let docMatches: string[] | undefined
  export let placeholder: IntlString | undefined
  export let width: 'medium' | 'large' | 'full' = 'medium'
  export let size: 'small' | 'medium' | 'large' = 'small'

  const dispatch = createEventDispatcher()

  const changeStatus = async (newStatus: any) => {
    if (!isEditable || newStatus == null) {
      dispatch('close', null)
      return
    }
    const docs = Array.isArray(value) ? value : [value]
    const c = getClient()

    const changed = (d: Doc) => (d as any)[attribute] !== newStatus
    await Promise.all(
      docs.filter(changed).map((it) => {
        // c.update(it, { [attribute]: newStatus } )
        const cl = Hierarchy.mixinOrClass(it)
        const attr = c.getHierarchy().getAttribute(cl, attribute)
        if (attr === undefined) {
          throw new Error('attribute not found')
        }
        return updateAttribute(c, it, cl, { key: attribute, attr }, newStatus)
      })
    )

    dispatch('close', newStatus)
  }

  $: current = (value as any)[attribute]

  let finalQuery: DocumentQuery<Doc> = {}

  let docMatch = true

  function updateQuery (
    query: DocumentQuery<Doc> | undefined,
    value: Doc | Doc[],
    fillQuery: Record<string, string> | undefined
  ): void {
    // Check if docMatches is applied.

    if (docMatches !== undefined && Array.isArray(value)) {
      for (const k of docMatches) {
        const v = (value[0] as any)[k]
        for (const d of value) {
          if (v !== (d as any)[k]) {
            docMatch = false
            return
          }
        }
      }
    }

    const q = { ...query }
    const docs = Array.isArray(value) ? value : [value]
    for (const [docKey, queryKey] of Object.entries(fillQuery ?? {})) {
      const vs: any[] = []

      for (const dv of docs) {
        const dvv = (dv as any)[docKey]
        if (dvv !== undefined) {
          if (!vs.includes(dvv)) {
            vs.push(dvv)
          }
        }
      }
      ;(q as any)[queryKey] = docs.length === 1 ? vs[0] : { $in: vs }

      if (docKey === '_object') {
        ;(q as any)[queryKey] = docs[0]
      }
    }
    finalQuery = q
    docMatch = true
  }

  $: updateQuery(query, value, fillQuery)
  $: huge = size === 'medium' || size === 'large'
</script>

{#if docMatch}
  {#if values}
    <SelectPopup
      value={values.map((it) => ({ ...it, isSelected: it.id === current }))}
      on:close={(evt) => changeStatus(evt.detail)}
      placeholder={placeholder ?? view.string.Filter}
      searchable
      {width}
      {size}
    />
  {:else if _class !== undefined}
    <ObjectPopup
      {_class}
      docQuery={finalQuery}
      options={queryOptions ?? {}}
      {searchField}
      allowDeselect={true}
      selected={current}
      on:close={(evt) => changeStatus(evt.detail?._id)}
      placeholder={placeholder ?? view.string.Filter}
      {width}
      {size}
    >
      <svelte:fragment slot="item" let:item>
        <div class="flex flex-grow overflow-label" class:mt-2={huge} class:mb-2={huge}>
          <ObjectPresenter
            objectId={item._id}
            _class={item._class}
            value={item}
            props={{ isInteractive: false, inline: true, size }}
          />
        </div>
      </svelte:fragment>
    </ObjectPopup>
  {/if}
{:else}
  <div class="selectPopup">
    <div class="flex-center w-60 h-18">
      <Label label={view.string.DontMatchCriteria} />
    </div>
  </div>
{/if}
