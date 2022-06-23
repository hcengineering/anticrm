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

import type { Employee } from '@anticrm/contact'
import contact from '@anticrm/contact'
import { Domain, DOMAIN_MODEL, IndexKind, Markup, Ref, Timestamp, Type } from '@anticrm/core'
import {
  ArrOf,
  Builder,
  Collection,
  Hidden,
  Index,
  Model,
  Prop,
  TypeDate,
  TypeMarkup,
  TypeNumber,
  TypeRef,
  TypeString,
  UX
} from '@anticrm/model'
import attachment from '@anticrm/model-attachment'
import chunter from '@anticrm/model-chunter'
import core, { DOMAIN_SPACE, TAttachedDoc, TDoc, TSpace, TType } from '@anticrm/model-core'
import view, { createAction } from '@anticrm/model-view'
import workbench, { createNavigateAction } from '@anticrm/model-workbench'
import notification from '@anticrm/notification'
import { Asset, IntlString } from '@anticrm/platform'
import setting from '@anticrm/setting'
import task from '@anticrm/task'
import {
  Document,
  Issue,
  IssuePriority,
  IssueStatus,
  IssueStatusCategory,
  Project,
  ProjectStatus,
  Team
} from '@anticrm/tracker'
import { KeyBinding } from '@anticrm/view'
import tags from '@anticrm/tags'
import tracker from './plugin'

import presentation from '@anticrm/model-presentation'

export { trackerOperation } from './migration'
export { default } from './plugin'

export const DOMAIN_TRACKER = 'tracker' as Domain

/**
 * @public
 */
@Model(tracker.class.IssueStatus, core.class.AttachedDoc, DOMAIN_TRACKER)
export class TIssueStatus extends TAttachedDoc implements IssueStatus {
  name!: string
  description?: string
  color?: number

  @Prop(TypeRef(tracker.class.IssueStatusCategory), tracker.string.StatusCategory)
  category!: Ref<IssueStatusCategory>

  @Prop(TypeString(), tracker.string.Rank)
  @Hidden()
  rank!: string
}

/**
 * @public
 */
@Model(tracker.class.IssueStatusCategory, core.class.Doc, DOMAIN_MODEL)
export class TIssueStatusCategory extends TDoc implements IssueStatusCategory {
  label!: IntlString
  icon!: Asset
  color!: number
  defaultStatusName!: string
  order!: number
}

/**
 * @public
 */
export function TypeIssuePriority (): Type<IssuePriority> {
  return { _class: tracker.class.TypeIssuePriority, label: 'TypeIssuePriority' as IntlString }
}

/**
 * @public
 */
@Model(tracker.class.TypeIssuePriority, core.class.Type, DOMAIN_MODEL)
export class TTypeIssuePriority extends TType {}

/**
 * @public
 */
export function TypeProjectStatus (): Type<ProjectStatus> {
  return { _class: tracker.class.TypeProjectStatus, label: 'TypeProjectStatus' as IntlString }
}

/**
 * @public
 */
@Model(tracker.class.TypeProjectStatus, core.class.Type, DOMAIN_MODEL)
export class TTypeProjectStatus extends TType {}

/**
 * @public
 */
@Model(tracker.class.Team, core.class.Space, DOMAIN_SPACE)
@UX(tracker.string.Team, tracker.icon.Team, tracker.string.Team)
export class TTeam extends TSpace implements Team {
  @Prop(TypeString(), tracker.string.Title)
  @Index(IndexKind.FullText)
  reamLogo!: IntlString

  @Prop(TypeString(), tracker.string.Identifier)
  @Index(IndexKind.FullText)
  identifier!: IntlString

  @Prop(TypeNumber(), tracker.string.Number)
  @Hidden()
  sequence!: number

  @Prop(Collection(tracker.class.IssueStatus), tracker.string.IssueStatuses)
  issueStatuses!: number

  @Prop(TypeRef(tracker.class.IssueStatus), tracker.string.DefaultIssueStatus)
  defaultIssueStatus!: Ref<IssueStatus>
}

/**
 * @public
 */
@Model(tracker.class.Issue, core.class.AttachedDoc, DOMAIN_TRACKER)
@UX(tracker.string.Issue, tracker.icon.Issue, tracker.string.Issue)
export class TIssue extends TAttachedDoc implements Issue {
  @Prop(TypeString(), tracker.string.Title)
  @Index(IndexKind.FullText)
  title!: string

  @Prop(TypeMarkup(), tracker.string.Description)
  @Index(IndexKind.FullText)
  description!: Markup

  @Prop(TypeRef(tracker.class.IssueStatus), tracker.string.Status)
  status!: Ref<IssueStatus>

  @Prop(TypeIssuePriority(), tracker.string.Priority)
  priority!: IssuePriority

  @Prop(TypeNumber(), tracker.string.Number)
  number!: number

  @Prop(TypeRef(contact.class.Employee), tracker.string.Assignee)
  assignee!: Ref<Employee> | null

  @Prop(TypeRef(tracker.class.Project), tracker.string.Project)
  project!: Ref<Project> | null

  @Prop(Collection(tracker.class.Issue), tracker.string.SubIssues)
  subIssues!: number

  @Prop(ArrOf(TypeRef(tracker.class.Issue)), tracker.string.BlockedBy)
  blockedBy!: Ref<Issue>[]

  @Prop(ArrOf(TypeRef(tracker.class.Issue)), tracker.string.RelatedTo)
  relatedIssue!: Ref<Issue>[]

  @Prop(ArrOf(TypeString()), tracker.string.ParentNames)
  parentNames!: string[]

  @Prop(Collection(chunter.class.Comment), tracker.string.Comments)
  comments!: number

  @Prop(Collection(attachment.class.Attachment), tracker.string.Attachments)
  attachments!: number

  @Prop(Collection(tags.class.TagReference), tracker.string.Labels)
  labels?: number

  declare space: Ref<Team>

  @Prop(TypeDate(true), tracker.string.DueDate)
  dueDate!: Timestamp | null

  @Prop(TypeString(), tracker.string.Rank)
  @Hidden()
  rank!: string
}

/**
 * @public
 */
@Model(tracker.class.Document, core.class.Doc, DOMAIN_TRACKER)
@UX(tracker.string.Document, tracker.icon.Document, tracker.string.Document)
export class TDocument extends TDoc implements Document {
  @Prop(TypeString(), tracker.string.Title)
  @Index(IndexKind.FullText)
  title!: string

  @Prop(TypeString(), tracker.string.DocumentIcon)
  icon!: string | null

  @Prop(TypeString(), tracker.string.DocumentColor)
  color!: number

  @Prop(TypeMarkup(), tracker.string.Description)
  @Index(IndexKind.FullText)
  content!: Markup

  declare space: Ref<Team>
}

/**
 * @public
 */
@Model(tracker.class.Project, core.class.Doc, DOMAIN_TRACKER)
@UX(tracker.string.Project, tracker.icon.Project, tracker.string.Project)
export class TProject extends TDoc implements Project {
  @Prop(TypeString(), tracker.string.Title)
  // @Index(IndexKind.FullText)
  label!: string

  @Prop(TypeMarkup(), tracker.string.Description)
  description?: Markup

  @Prop(TypeString(), tracker.string.AssetLabel)
  icon!: Asset

  @Prop(TypeProjectStatus(), tracker.string.Status)
  status!: ProjectStatus

  @Prop(TypeRef(contact.class.Employee), tracker.string.ProjectLead)
  lead!: Ref<Employee> | null

  @Prop(ArrOf(TypeRef(contact.class.Employee)), tracker.string.Members)
  members!: Ref<Employee>[]

  @Prop(Collection(chunter.class.Comment), chunter.string.Comments)
  comments!: number

  @Prop(Collection(tracker.class.Document), tracker.string.Document)
  documents!: number

  @Prop(Collection(attachment.class.Attachment), attachment.string.Attachments, undefined, attachment.string.Files)
  attachments?: number

  @Prop(TypeDate(true), tracker.string.StartDate)
  startDate!: Timestamp | null

  @Prop(TypeDate(true), tracker.string.TargetDate)
  targetDate!: Timestamp | null

  declare space: Ref<Team>
}

export function createModel (builder: Builder): void {
  builder.createModel(
    TTeam,
    TProject,
    TIssue,
    TIssueStatus,
    TIssueStatusCategory,
    TTypeIssuePriority,
    TTypeProjectStatus
  )

  builder.createDoc(view.class.Viewlet, core.space.Model, {
    attachTo: tracker.class.Issue,
    descriptor: tracker.viewlet.List,
    config: [
      { key: '', presenter: tracker.component.PriorityEditor, props: { kind: 'list', size: 'small' } },
      '@currentTeam',
      '@statuses',
      { key: '', presenter: tracker.component.TitlePresenter, props: { shouldUseMargin: true, fixed: 'left' } },
      { key: '', presenter: tracker.component.DueDatePresenter, props: { kind: 'list' } },
      {
        key: '',
        presenter: tracker.component.ProjectEditor,
        props: { kind: 'list', size: 'small', shape: 'round', shouldShowPlaceholder: false }
      },
      { key: 'modifiedOn', presenter: tracker.component.ModificationDatePresenter, props: { fixed: 'right' } },
      {
        key: '$lookup.assignee',
        presenter: tracker.component.AssigneePresenter,
        props: { defaultClass: contact.class.Employee, shouldShowLabel: false }
      }
    ]
  })

  builder.createDoc(
    view.class.ViewletDescriptor,
    core.space.Model,
    {
      label: tracker.string.List,
      icon: view.icon.Table,
      component: tracker.component.ListView
    },
    tracker.viewlet.List
  )

  builder.createDoc(view.class.Viewlet, core.space.Model, {
    attachTo: tracker.class.Issue,
    descriptor: tracker.viewlet.Kanban,
    config: []
  })

  builder.createDoc(
    view.class.ViewletDescriptor,
    core.space.Model,
    {
      label: tracker.string.Board,
      icon: task.icon.Kanban,
      component: tracker.component.KanbanView
    },
    tracker.viewlet.Kanban
  )

  builder.createDoc(
    tracker.class.IssueStatusCategory,
    core.space.Model,
    {
      label: tracker.string.CategoryBacklog,
      icon: tracker.icon.CategoryBacklog,
      color: 0,
      defaultStatusName: 'Backlog',
      order: 0
    },
    tracker.issueStatusCategory.Backlog
  )

  builder.createDoc(
    tracker.class.IssueStatusCategory,
    core.space.Model,
    {
      label: tracker.string.CategoryUnstarted,
      icon: tracker.icon.CategoryUnstarted,
      color: 1,
      defaultStatusName: 'Todo',
      order: 1
    },
    tracker.issueStatusCategory.Unstarted
  )

  builder.createDoc(
    tracker.class.IssueStatusCategory,
    core.space.Model,
    {
      label: tracker.string.CategoryStarted,
      icon: tracker.icon.CategoryStarted,
      color: 2,
      defaultStatusName: 'In Progress',
      order: 2
    },
    tracker.issueStatusCategory.Started
  )

  builder.createDoc(
    tracker.class.IssueStatusCategory,
    core.space.Model,
    {
      label: tracker.string.CategoryCompleted,
      icon: tracker.icon.CategoryCompleted,
      color: 3,
      defaultStatusName: 'Done',
      order: 3
    },
    tracker.issueStatusCategory.Completed
  )

  builder.createDoc(
    tracker.class.IssueStatusCategory,
    core.space.Model,
    {
      label: tracker.string.CategoryCanceled,
      icon: tracker.icon.CategoryCanceled,
      color: 4,
      defaultStatusName: 'Canceled',
      order: 4
    },
    tracker.issueStatusCategory.Canceled
  )

  const issuesId = 'issues'
  const activeId = 'active'
  const backlogId = 'backlog'
  const boardId = 'board'
  const projectsId = 'projects'

  builder.mixin(tracker.class.Issue, core.class.Class, view.mixin.AttributePresenter, {
    presenter: tracker.component.IssuePresenter
  })

  builder.mixin(tracker.class.Issue, core.class.Class, view.mixin.PreviewPresenter, {
    presenter: tracker.component.IssuePreview
  })

  builder.mixin(tracker.class.TypeIssuePriority, core.class.Class, view.mixin.AttributePresenter, {
    presenter: tracker.component.PriorityPresenter
  })

  builder.mixin(tracker.class.TypeIssuePriority, core.class.Class, view.mixin.AttributeFilter, {
    component: view.component.ValueFilter
  })

  builder.mixin(tracker.class.IssueStatus, core.class.Class, view.mixin.AttributePresenter, {
    presenter: tracker.component.StatusPresenter
  })

  builder.mixin(tracker.class.Project, core.class.Class, view.mixin.AttributePresenter, {
    presenter: tracker.component.ProjectTitlePresenter
  })

  builder.mixin(tracker.class.Issue, core.class.Class, setting.mixin.Editable, {})

  builder.mixin(tracker.class.TypeProjectStatus, core.class.Class, view.mixin.AttributeEditor, {
    inlineEditor: tracker.component.ProjectStatusEditor
  })

  builder.mixin(tracker.class.Issue, core.class.Class, notification.mixin.LastViewAttached, {})
  builder.mixin(tracker.class.Issue, core.class.Class, notification.mixin.AnotherUserNotifications, {
    fields: ['assignee']
  })

  builder.createDoc(
    workbench.class.Application,
    core.space.Model,
    {
      label: tracker.string.TrackerApplication,
      icon: tracker.icon.TrackerApplication,
      hidden: false,
      navigatorModel: {
        specials: [
          {
            id: 'inbox',
            position: 'top',
            label: tracker.string.Inbox,
            icon: tracker.icon.Inbox,
            component: tracker.component.Inbox
          },
          {
            id: 'my-issues',
            position: 'top',
            label: tracker.string.MyIssues,
            icon: tracker.icon.MyIssues,
            component: tracker.component.MyIssues
          },
          {
            id: 'views',
            position: 'top',
            label: tracker.string.Views,
            icon: tracker.icon.Views,
            component: tracker.component.Views
          }
        ],
        spaces: [
          {
            label: tracker.string.Teams,
            spaceClass: tracker.class.Team,
            addSpaceLabel: tracker.string.CreateTeam,
            createComponent: tracker.component.CreateTeam,
            icon: tracker.icon.Home,
            specials: [
              {
                id: issuesId,
                label: tracker.string.Issues,
                icon: tracker.icon.Issues,
                component: tracker.component.IssuesView,
                componentProps: {
                  title: tracker.string.Issues
                }
              },
              {
                id: activeId,
                label: tracker.string.Active,
                // icon: tracker.icon.TrackerApplication,
                component: tracker.component.Active
              },
              {
                id: backlogId,
                label: tracker.string.Backlog,
                // icon: tracker.icon.TrackerApplication,
                component: tracker.component.Backlog
              },
              {
                id: projectsId,
                label: tracker.string.Projects,
                icon: tracker.icon.Projects,
                component: tracker.component.Projects
              }
            ]
          }
        ]
      },
      navHeaderComponent: tracker.component.NewIssueHeader
    },
    tracker.app.Tracker
  )

  function createGotoSpecialAction (builder: Builder, id: string, key: KeyBinding, label: IntlString): void {
    createNavigateAction(builder, key, label, {
      application: tracker.app.Tracker,
      mode: 'space',
      spaceSpecial: id,
      spaceClass: tracker.class.Team
    })
  }

  createGotoSpecialAction(builder, issuesId, 'g->e', tracker.string.GotoIssues)
  createGotoSpecialAction(builder, activeId, 'g->a', tracker.string.GotoActive)
  createGotoSpecialAction(builder, backlogId, 'g->b', tracker.string.GotoBacklog)
  createGotoSpecialAction(builder, boardId, 'g->d', tracker.string.GotoBoard)
  createGotoSpecialAction(builder, projectsId, 'g->p', tracker.string.GotoProjects)

  createAction(builder, {
    action: workbench.actionImpl.Navigate,
    actionProps: {
      mode: 'app',
      application: tracker.app.Tracker
    },
    label: tracker.string.GotoTrackerApplication,
    icon: view.icon.ArrowRight,
    input: 'none',
    category: view.category.Navigation,
    target: core.class.Doc,
    context: {
      mode: ['workbench', 'browser', 'editor', 'panel', 'popup']
    }
  })

  builder.createDoc(
    view.class.ActionCategory,
    core.space.Model,
    { label: tracker.string.TrackerApplication, visible: true },
    tracker.category.Tracker
  )

  createAction(
    builder,
    {
      action: view.actionImpl.ShowPopup,
      actionProps: {
        component: tracker.component.SetDueDateActionPopup,
        props: { mondayStart: true, withTime: false },
        element: 'top'
      },
      label: tracker.string.SetDueDate,
      icon: tracker.icon.DueDate,
      keyBinding: [],
      input: 'none',
      category: tracker.category.Tracker,
      target: tracker.class.Issue,
      context: {
        mode: ['context', 'browser'],
        application: tracker.app.Tracker
      }
    },
    tracker.action.SetDueDate
  )

  createAction(
    builder,
    {
      action: view.actionImpl.ShowPopup,
      actionProps: {
        component: tracker.component.SetParentIssueActionPopup,
        element: 'top'
      },
      query: {
        // Hide this action if the issue has subtasks to avoid circular
        // dependencies and assigning the issue to its own subtask.
        subIssues: 0
      },
      label: tracker.string.SetParent,
      icon: tracker.icon.Parent,
      keyBinding: [],
      input: 'none',
      category: tracker.category.Tracker,
      target: tracker.class.Issue,
      context: {
        mode: ['context', 'browser'],
        application: tracker.app.Tracker
      }
    },
    tracker.action.SetParent
  )

  builder.mixin(tracker.class.Issue, core.class.Class, view.mixin.ClassFilters, {
    filters: ['status', 'priority', 'assignee', 'project', 'dueDate', 'modifiedOn']
  })

  builder.createDoc(
    presentation.class.ObjectSearchCategory,
    core.space.Model,
    {
      icon: tracker.icon.TrackerApplication,
      label: tracker.string.SearchIssue,
      query: tracker.completion.IssueQuery
    },
    tracker.completion.IssueCategory
  )
}
