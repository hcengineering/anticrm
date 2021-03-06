//
// Copyright © 2020 Anticrm Platform Contributors.
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

import type { Client, Doc, FindResult, ObjQueryType, Ref } from '@anticrm/core'
import { IntlString, OK, Resources, Severity, Status, translate } from '@anticrm/platform'
import { ObjectSearchResult } from '@anticrm/presentation'
import { Applicant, Candidate } from '@anticrm/recruit'
import task from '@anticrm/task'
import { showPopup } from '@anticrm/ui'
import { Filter } from '@anticrm/view'
import { FilterQuery } from '@anticrm/view-resources'
import ApplicantFilter from './components/ApplicantFilter.svelte'
import ApplicationItem from './components/ApplicationItem.svelte'
import ApplicationPresenter from './components/ApplicationPresenter.svelte'
import Applications from './components/Applications.svelte'
import ApplicationsPresenter from './components/ApplicationsPresenter.svelte'
import CreateApplication from './components/CreateApplication.svelte'
import CreateCandidate from './components/CreateCandidate.svelte'
import CreateVacancy from './components/CreateVacancy.svelte'
import EditApplication from './components/EditApplication.svelte'
import EditVacancy from './components/EditVacancy.svelte'
import KanbanCard from './components/KanbanCard.svelte'
import NewCandidateHeader from './components/NewCandidateHeader.svelte'
import CreateOpinion from './components/review/CreateOpinion.svelte'
import CreateReview from './components/review/CreateReview.svelte'
import EditReview from './components/review/EditReview.svelte'
import OpinionPresenter from './components/review/OpinionPresenter.svelte'
import Opinions from './components/review/Opinions.svelte'
import OpinionsPresenter from './components/review/OpinionsPresenter.svelte'
import ReviewPresenter from './components/review/ReviewPresenter.svelte'
import Reviews from './components/review/Reviews.svelte'
import SkillsView from './components/SkillsView.svelte'
import TemplatesIcon from './components/TemplatesIcon.svelte'
import Vacancies from './components/Vacancies.svelte'
import VacancyCountPresenter from './components/VacancyCountPresenter.svelte'
import VacancyItemPresenter from './components/VacancyItemPresenter.svelte'
import VacancyModifiedPresenter from './components/VacancyModifiedPresenter.svelte'
import VacancyPresenter from './components/VacancyPresenter.svelte'
import recruit from './plugin'
import { copyToClipboard, getApplicationTitle } from './utils'

async function createOpinion (object: Doc): Promise<void> {
  showPopup(CreateOpinion, { space: object.space, review: object._id })
}

export async function applicantValidator (applicant: Applicant, client: Client): Promise<Status> {
  if (applicant.attachedTo === undefined) {
    return new Status(Severity.INFO, recruit.status.TalentRequired, {})
  }
  if (applicant.space === undefined) {
    return new Status(Severity.INFO, recruit.status.VacancyRequired, {})
  }
  const applicants = await client.findAll(recruit.class.Applicant, {
    space: applicant.space,
    attachedTo: applicant.attachedTo
  })
  if (applicants.filter((p) => p._id !== applicant._id).length > 0) {
    return new Status(Severity.ERROR, recruit.status.ApplicationExists, {})
  }
  return OK
}

export async function queryApplication (client: Client, search: string): Promise<ObjectSearchResult[]> {
  const _class = recruit.class.Applicant
  const cl = client.getHierarchy().getClass(_class)
  const shortLabel = (await translate(cl.shortLabel ?? ('' as IntlString), {})).toUpperCase()

  // Check number pattern

  const sequence = (await client.findOne(task.class.Sequence, { attachedTo: _class }))?.sequence ?? 0

  const named = new Map(
    (
      await client.findAll(_class, { $search: search }, { limit: 200, lookup: { attachedTo: recruit.mixin.Candidate } })
    ).map((e) => [e._id, e])
  )
  const nids: number[] = []
  if (sequence > 0) {
    for (let n = 0; n < sequence; n++) {
      const v = `${n}`
      if (v.includes(search)) {
        nids.push(n)
      }
    }
    const numbered = await client.findAll<Applicant>(
      _class,
      { number: { $in: nids } },
      { limit: 200, lookup: { attachedTo: recruit.mixin.Candidate } }
    )
    for (const d of numbered) {
      if (!named.has(d._id)) {
        named.set(d._id, d)
      }
    }
  }

  return Array.from(named.values()).map((e) => ({
    doc: e,
    title: `${shortLabel}-${e.number}`,
    icon: recruit.icon.Application,
    component: ApplicationItem
  }))
}

async function getActiveTalants (filter: Filter, onUpdate: () => void): Promise<Array<Ref<Doc>>> {
  const promise = new Promise<Array<Ref<Doc>>>((resolve, reject) => {
    let refresh: boolean = false
    const lq = FilterQuery.getLiveQuery(filter.index)
    refresh = lq.query(
      recruit.class.Applicant,
      {
        doneState: undefined
      },
      (refs: FindResult<Applicant>) => {
        const result = Array.from(new Set(refs.map((p) => p.attachedTo)))
        FilterQuery.results.set(filter.index, result)
        resolve(result)
        onUpdate()
      },
      {
        projection: {
          _id: 1,
          _class: 1,
          doneState: 1,
          attachedTo: 1
        }
      }
    )

    if (!refresh) {
      resolve(FilterQuery.results.get(filter.index) ?? [])
    }
  })
  return await promise
}

async function getNoApplicantCandidates (filter: Filter, onUpdate: () => void): Promise<Array<Ref<Doc>>> {
  const promise = new Promise<Array<Ref<Doc>>>((resolve, reject) => {
    let refresh: boolean = false
    const lq = FilterQuery.getLiveQuery(filter.index)
    refresh = lq.query(
      recruit.mixin.Candidate,
      {
        applications: { $in: [0, undefined] }
      },
      (refs: FindResult<Candidate>) => {
        const result = Array.from(refs.map((p) => p._id))
        FilterQuery.results.set(filter.index, result)
        resolve(result)
        onUpdate()
      },
      {
        projection: {
          _id: 1,
          _class: 1,
          applications: 1
        }
      }
    )

    if (!refresh) {
      resolve(FilterQuery.results.get(filter.index) ?? [])
    }
  })
  return await promise
}

async function hasActiveApplicant (filter: Filter, onUpdate: () => void): Promise<ObjQueryType<any>> {
  const result = await getActiveTalants(filter, onUpdate)
  return { $in: result }
}
async function hasNoActiveApplicant (filter: Filter, onUpdate: () => void): Promise<ObjQueryType<any>> {
  const result = await getActiveTalants(filter, onUpdate)
  return { $nin: result }
}
async function noneApplicant (filter: Filter, onUpdate: () => void): Promise<ObjQueryType<any>> {
  const result = await getNoApplicantCandidates(filter, onUpdate)
  return { $in: result }
}

export default async (): Promise<Resources> => ({
  actionImpl: {
    CreateOpinion: createOpinion,
    CopyToClipboard: copyToClipboard
  },
  validator: {
    ApplicantValidator: applicantValidator
  },
  component: {
    CreateVacancy,
    CreateApplication,
    EditApplication,
    KanbanCard,
    ApplicationPresenter,
    ApplicationsPresenter,
    EditVacancy,
    TemplatesIcon,
    Applications,
    CreateCandidate,
    VacancyPresenter,
    SkillsView,
    Vacancies,
    VacancyItemPresenter,
    VacancyCountPresenter,
    VacancyModifiedPresenter,

    CreateReview,
    ReviewPresenter,
    EditReview,
    Reviews,
    Opinions,
    OpinionPresenter,
    OpinionsPresenter,

    NewCandidateHeader,

    ApplicantFilter
  },
  completion: {
    ApplicationQuery: async (client: Client, query: string) => await queryApplication(client, query)
  },
  function: {
    ApplicationTitleProvider: getApplicationTitle,
    HasActiveApplicant: hasActiveApplicant,
    HasNoActiveApplicant: hasNoActiveApplicant,
    NoneApplications: noneApplicant
  }
})
