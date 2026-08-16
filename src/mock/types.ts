// 목업 데이터 타입 — docs/DEN-DESIGN.md 4장 데이터 모델(ERD) 기준

export type TaskStatus = 'todo' | 'progress' | 'review' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type MenuKey = 'tasks' | 'gantt' | 'messenger'

export interface User {
  id: string
  name: string
  email: string
  initials: string
  avatarGradient: string // 예: 'linear-gradient(135deg,#f59e0b,#ef4444)'
  title?: string // 예: '프로젝트 리드'
}

export interface Project {
  id: string
  key: string // 사람이 읽는 키 ("APP"). URL에 노출됨
  name: string
  description: string
  color: string // 사이드바 프로젝트 점 색상 / 카드 마크 배경
  folderId: string | null // null이면 미분류
  memberIds: string[]
}

export interface Folder {
  id: string
  name: string
  collapsed?: boolean
}

export interface Role {
  id: string
  projectId: string
  name: string
  isAdmin: boolean
  menuPermissions: Record<MenuKey, boolean>
}

export interface ProjectMember {
  userId: string
  projectId: string
  roleId: string
  invitedAt: string // ISO date
}

export interface Tag {
  id: string
  projectId: string
  name: string
}

export interface Task {
  id: string
  code: string // 예: "APP-142"
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeIds: string[] // 다대다
  watcherIds: string[]
  parentId: string | null
  dependencyIds: string[] // 선행 업무 (간트용)
  tagIds: string[]
  startDate: string // ISO date
  endDate: string // ISO date
  progress: number // 0-100
  isPrivate: boolean
  commentCount: number
}

export interface Comment {
  id: string
  taskId: string
  authorId: string
  body: string
  mentionUserIds: string[]
  createdAt: string // ISO datetime
}

export interface Channel {
  id: string
  projectId: string
  name: string
  type: 'group' | 'dm'
  memberIds: string[]
  unreadCount: number
}

export interface Message {
  id: string
  channelId: string
  authorId: string
  body: string
  mentionUserIds: string[]
  createdAt: string // ISO datetime
}

export type NotificationType =
  | 'task_mention'
  | 'task_assigned'
  | 'task_due_soon'
  | 'task_status_changed'
  | 'channel_message'
  | 'project_invited'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  projectKey: string | null
  linkTaskId?: string
  linkChannelId?: string
  isRead: boolean
  createdAt: string // ISO datetime
}
