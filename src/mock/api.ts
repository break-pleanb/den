// 목업 API 함수 — 백엔드 없이 @tanstack/vue-query가 호출하는 진입점.
// 나중에 axios 기반 실제 API 함수로 교체될 자리 (시그니처는 최대한 유지).

import { getChannelsByProject, getUnreadChannelCount, mockChannels } from './channels'
import { getMessagesByChannel, mockMessages, pickAutoReplyBody } from './messages'
import {
  getUnreadNotificationCount as computeUnreadNotificationCount,
  mockNotifications,
} from './notifications'
import { getMemberRole, mockProjectMembers, mockRoles } from './permissions'
import { getProjectByKey } from './projects'
import { CURRENT_USER_ID, getUserById, mockUsers } from './users'
import type { AppNotification, Channel, MenuKey, Message, ProjectMember, Role, User } from './types'

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

export async function fetchProjectMembers(projectKey: string): Promise<ProjectMember[]> {
  const project = getProjectByKey(projectKey)
  if (!project) return []
  return structuredClone(mockProjectMembers.filter((m) => m.projectId === project.id))
}

// 초대받는 사람 이름으로부터 아바타 이니셜을 만든다. 성/이름처럼 공백으로 나뉘면 각 첫 글자,
// 아니면(한글 이름 등) 앞 두 글자를 사용한다.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

const AVATAR_GRADIENT_PALETTE = [
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#14b8a6,#0ea5e9)',
  'linear-gradient(135deg,#a855f7,#7c3aed)',
]

export async function inviteProjectMember(
  projectKey: string,
  name: string,
  email: string,
  roleId: string,
): Promise<User> {
  const project = getProjectByKey(projectKey)
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다')

  const user: User = {
    id: `u-${crypto.randomUUID()}`,
    name,
    email,
    initials: initialsOf(name),
    avatarGradient: AVATAR_GRADIENT_PALETTE[mockUsers.length % AVATAR_GRADIENT_PALETTE.length],
  }
  mockUsers.push(user)
  project.memberIds.push(user.id)
  mockProjectMembers.push({
    userId: user.id,
    projectId: project.id,
    roleId,
    invitedAt: new Date().toISOString().slice(0, 10),
  })
  return structuredClone(user)
}

export async function updateProjectMemberRole(
  projectKey: string,
  userId: string,
  roleId: string,
): Promise<void> {
  const project = getProjectByKey(projectKey)
  if (!project) return
  const member = mockProjectMembers.find((m) => m.projectId === project.id && m.userId === userId)
  if (member) member.roleId = roleId
}

export async function removeProjectMember(projectKey: string, userId: string): Promise<void> {
  const project = getProjectByKey(projectKey)
  if (!project) return
  const idx = mockProjectMembers.findIndex((m) => m.projectId === project.id && m.userId === userId)
  if (idx !== -1) mockProjectMembers.splice(idx, 1)
  project.memberIds = project.memberIds.filter((id) => id !== userId)
}

export async function updateRoleMenuPermission(
  roleId: string,
  menuKey: MenuKey,
  value: boolean,
): Promise<void> {
  const role = mockRoles.find((r) => r.id === roleId)
  if (role) role.menuPermissions[menuKey] = value
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

export async function fetchMessagesByChannelId(channelId: string): Promise<Message[]> {
  return structuredClone(getMessagesByChannel(channelId))
}

export async function sendMessage(
  channelId: string,
  body: string,
  mentionUserIds: string[],
): Promise<Message> {
  const message: Message = {
    id: `m-${crypto.randomUUID()}`,
    channelId,
    authorId: CURRENT_USER_ID,
    body,
    mentionUserIds,
    createdAt: new Date().toISOString(),
  }
  mockMessages.push(message)
  return structuredClone(message)
}

// 현재 보고 있는 채널을 읽음 처리 — 안읽음 배지가 사이드바·컨텍스트바에서 즉시 사라진다
export async function markChannelRead(channelId: string): Promise<void> {
  const channel = mockChannels.find((c) => c.id === channelId)
  if (channel) channel.unreadCount = 0
}

// 방금 보낸 메시지에 대한 응답을 특정 발신자 명의로 채널에 추가한다 (실시간 시뮬레이션용)
export async function addAutoReply(channelId: string, authorId: string): Promise<Message> {
  const message: Message = {
    id: `m-${crypto.randomUUID()}`,
    channelId,
    authorId,
    body: pickAutoReplyBody(),
    mentionUserIds: [],
    createdAt: new Date().toISOString(),
  }
  mockMessages.push(message)
  return structuredClone(message)
}

// 열려있지 않은 다른 채널에 누군가 메시지를 보낸 것처럼 시뮬레이션한다 (실시간 시뮬레이션용).
// activeChannelId는 시뮬레이션 대상에서 제외해 지금 보고 있는 채널의 안읽음 수는 건드리지 않는다
export async function simulateBackgroundActivity(
  projectKey: string,
  activeChannelId?: string,
): Promise<Message | null> {
  const project = getProjectByKey(projectKey)
  if (!project) return null
  const candidates = getChannelsByProject(project.id).filter((c) => c.id !== activeChannelId)
  if (!candidates.length) return null

  const channel = candidates[Math.floor(Math.random() * candidates.length)]
  const others = channel.memberIds.filter((id) => id !== CURRENT_USER_ID)
  if (!others.length) return null
  const authorId = others[Math.floor(Math.random() * others.length)]

  const message: Message = {
    id: `m-${crypto.randomUUID()}`,
    channelId: channel.id,
    authorId,
    body: pickAutoReplyBody(),
    mentionUserIds: [],
    createdAt: new Date().toISOString(),
  }
  mockMessages.push(message)
  const target = mockChannels.find((c) => c.id === channel.id)
  if (target) target.unreadCount += 1
  return structuredClone(message)
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
