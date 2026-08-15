// 목업 API 함수 — 백엔드 없이 @tanstack/vue-query가 호출하는 진입점.
// 나중에 axios 기반 실제 API 함수로 교체될 자리 (시그니처는 최대한 유지).

import { getChannelsByProject, getUnreadChannelCount } from './channels'
import {
  getUnreadNotificationCount as computeUnreadNotificationCount,
  mockNotifications,
} from './notifications'
import { getMemberRole, mockProjectMembers, mockRoles } from './permissions'
import { mockFavoriteProjectIds, mockFolders, mockProjects, getProjectByKey } from './projects'
import { getSubtaskCount, getTaskById, getTasksByProject, mockTasks } from './tasks'
import { getTagsByProject } from './tags'
import { CURRENT_USER_ID, getUserById, mockUsers } from './users'
import type { AppNotification, Channel, Folder, MenuKey, Project, Role, Tag, Task, User } from './types'

// ── 프로젝트 / 폴더 / 즐겨찾기 ──────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  return structuredClone(mockProjects)
}

export async function fetchProjectByKey(key: string): Promise<Project | undefined> {
  return structuredClone(getProjectByKey(key))
}

export async function fetchFolders(): Promise<Folder[]> {
  return structuredClone(mockFolders)
}

export async function createFolder(name: string): Promise<Folder> {
  const folder: Folder = { id: `f-${crypto.randomUUID()}`, name }
  mockFolders.push(folder)
  return structuredClone(folder)
}

export async function moveProjectToFolder(projectId: string, folderId: string | null): Promise<Project | undefined> {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return undefined
  project.folderId = folderId
  return structuredClone(project)
}

// 새 프로젝트 카드 마크 배경으로 순환 사용할 액센트 팔레트
const NEW_PROJECT_COLOR_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#0ea5e9', '#14b8a6',
  '#ef4444', '#22c55e', '#a855f7', '#10b981', '#f59e0b', '#06b6d4', '#f97316',
]

export async function createProject(name: string, folderId: string | null = null): Promise<Project> {
  const id = `p-${crypto.randomUUID()}`
  const key = `PROJ${Date.now().toString(36).toUpperCase()}`
  const color = NEW_PROJECT_COLOR_PALETTE[mockProjects.length % NEW_PROJECT_COLOR_PALETTE.length]
  const project: Project = { id, key, name, description: '', color, folderId, memberIds: [CURRENT_USER_ID] }
  mockProjects.push(project)

  const roleId = `r-${id}-admin`
  mockRoles.push({ id: roleId, projectId: id, name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } })
  mockProjectMembers.push({ userId: CURRENT_USER_ID, projectId: id, roleId })

  return structuredClone(project)
}

// 현재 사용자의 프로젝트별 역할 (projectId -> Role). 홈 화면 카드의 역할 배지용
export async function fetchMyProjectRoles(): Promise<Record<string, Role | undefined>> {
  const entries = mockProjects.map((p) => [p.id, getMemberRole(p.id, CURRENT_USER_ID)] as const)
  return structuredClone(Object.fromEntries(entries))
}

export async function fetchFavoriteProjectIds(): Promise<string[]> {
  return [...mockFavoriteProjectIds]
}

export async function toggleFavoriteProject(projectId: string): Promise<string[]> {
  const idx = mockFavoriteProjectIds.indexOf(projectId)
  if (idx === -1) mockFavoriteProjectIds.push(projectId)
  else mockFavoriteProjectIds.splice(idx, 1)
  return [...mockFavoriteProjectIds]
}

// ── 사용자 / 권한 ──────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  return structuredClone(mockUsers)
}

export async function fetchRolesByProjectKey(projectKey: string): Promise<Role[]> {
  const project = getProjectByKey(projectKey)
  if (!project) return []
  return structuredClone(mockRoles.filter((r) => r.projectId === project.id))
}

export async function fetchProjectMemberRoles(projectKey: string): Promise<Record<string, Role | undefined>> {
  const project = getProjectByKey(projectKey)
  if (!project) return {}
  const entries = mockProjectMembers
    .filter((m) => m.projectId === project.id)
    .map((m) => [m.userId, getMemberRole(project.id, m.userId)] as const)
  return structuredClone(Object.fromEntries(entries))
}

export async function fetchMenuPermissions(projectKey: string): Promise<Record<MenuKey, boolean>> {
  const project = getProjectByKey(projectKey)
  const fallback: Record<MenuKey, boolean> = { tasks: true, gantt: true, messenger: true }
  if (!project) return fallback
  const role = getMemberRole(project.id, CURRENT_USER_ID)
  return role ? { ...role.menuPermissions } : fallback
}

// ── 업무 ──────────────────────────────────────────────────

export async function fetchTasksByProjectKey(projectKey: string): Promise<Task[]> {
  const project = getProjectByKey(projectKey)
  if (!project) return []
  return structuredClone(getTasksByProject(project.id))
}

// 모든 프로젝트의 업무. 전체 프로젝트 홈의 카드별 진행 요약·통계 계산용
export async function fetchAllTasks(): Promise<Task[]> {
  return structuredClone(mockTasks)
}

export async function fetchTaskById(taskId: string): Promise<Task | undefined> {
  return structuredClone(getTaskById(taskId))
}

export async function fetchSubtaskCount(taskId: string): Promise<number> {
  return getSubtaskCount(taskId)
}

export async function fetchTagsByProjectKey(projectKey: string): Promise<Tag[]> {
  const project = getProjectByKey(projectKey)
  if (!project) return []
  return structuredClone(getTagsByProject(project.id))
}

export async function fetchMyTaskCount(): Promise<number> {
  return mockTasks.filter((t) => t.assigneeIds.includes(CURRENT_USER_ID) && t.status !== 'done').length
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | undefined> {
  const task = mockTasks.find((t) => t.id === taskId)
  if (!task) return undefined
  task.status = status
  if (status === 'done') task.progress = 100
  return structuredClone(task)
}

// ── 메신저 ────────────────────────────────────────────────

export async function fetchChannelsByProjectKey(projectKey: string): Promise<Channel[]> {
  const project = getProjectByKey(projectKey)
  if (!project) return []
  return structuredClone(getChannelsByProject(project.id))
}

export async function fetchUnreadChannelCount(projectKey: string): Promise<number> {
  const project = getProjectByKey(projectKey)
  if (!project) return 0
  return getUnreadChannelCount(project.id)
}

// ── 알림 ──────────────────────────────────────────────────

export async function fetchNotifications(): Promise<AppNotification[]> {
  return structuredClone(mockNotifications.filter((n) => n.userId === CURRENT_USER_ID))
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  return computeUnreadNotificationCount()
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const target = mockNotifications.find((n) => n.id === notificationId)
  if (target) target.isRead = true
}

export async function markAllNotificationsRead(): Promise<void> {
  for (const n of mockNotifications) {
    if (n.userId === CURRENT_USER_ID) n.isRead = true
  }
}

// ── 현재 사용자 ───────────────────────────────────────────

export async function fetchCurrentUser(): Promise<User> {
  const user = getUserById(CURRENT_USER_ID)
  if (!user) throw new Error('현재 사용자를 찾을 수 없습니다')
  return structuredClone(user)
}
