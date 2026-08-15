import type { ProjectMember, Role } from './types'

// 역할 — 프로젝트별 관리자/편집자/뷰어. 메뉴 권한은 역할에 묶임 (보기/편집 구분 없음)
export const mockRoles: Role[] = [
  { id: 'r-app-admin', projectId: 'p-app', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-app-editor', projectId: 'p-app', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-app-viewer', projectId: 'p-app', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-backend-admin', projectId: 'p-backend', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-backend-editor', projectId: 'p-backend', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },

  { id: 'r-simsec-admin', projectId: 'p-sim-sec', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: false, messenger: true } },
  { id: 'r-simsec-editor', projectId: 'p-sim-sec', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: false, messenger: true } },
]

export const mockProjectMembers: ProjectMember[] = [
  { userId: 'u-jk', projectId: 'p-app', roleId: 'r-app-admin' },
  { userId: 'u-sy', projectId: 'p-app', roleId: 'r-app-editor' },
  { userId: 'u-km', projectId: 'p-app', roleId: 'r-app-editor' },
  { userId: 'u-hr', projectId: 'p-app', roleId: 'r-app-viewer' },

  { userId: 'u-jk', projectId: 'p-backend', roleId: 'r-backend-admin' },
  { userId: 'u-sa', projectId: 'p-backend', roleId: 'r-backend-editor' },

  { userId: 'u-jk', projectId: 'p-sim-sec', roleId: 'r-simsec-admin' },
  { userId: 'u-jy', projectId: 'p-sim-sec', roleId: 'r-simsec-editor' },
]

export function getRoleById(id: string): Role | undefined {
  return mockRoles.find((r) => r.id === id)
}

export function getMemberRole(projectId: string, userId: string): Role | undefined {
  const member = mockProjectMembers.find((m) => m.projectId === projectId && m.userId === userId)
  return member ? getRoleById(member.roleId) : undefined
}
