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

  { id: 'r-simproc-admin', projectId: 'p-sim-proc', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-simproc-editor', projectId: 'p-sim-proc', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },

  { id: 'r-sim35-admin', projectId: 'p-sim35', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-sim35-editor', projectId: 'p-sim35', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-sim35-viewer', projectId: 'p-sim35', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-tfa-admin', projectId: 'p-tfa', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-tfa-editor', projectId: 'p-tfa', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },

  { id: 'r-ztna-admin', projectId: 'p-ztna', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },

  { id: 'r-girok-admin', projectId: 'p-girok', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girok-editor', projectId: 'p-girok', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girok-viewer', projectId: 'p-girok', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-paint-admin', projectId: 'p-paint', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-paint-viewer', projectId: 'p-paint', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-artpiad-admin', projectId: 'p-artpiad', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },

  { id: 'r-myfi-admin', projectId: 'p-myfi', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-myfi-viewer', projectId: 'p-myfi', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-girokweb-admin', projectId: 'p-girokweb', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girokweb-viewer', projectId: 'p-girokweb', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-intra-admin', projectId: 'p-intra', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-intra-viewer', projectId: 'p-intra', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-mkt-admin', projectId: 'p-mkt', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-mkt-viewer', projectId: 'p-mkt', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },
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

  { userId: 'u-jk', projectId: 'p-sim-proc', roleId: 'r-simproc-admin' },
  { userId: 'u-jy', projectId: 'p-sim-proc', roleId: 'r-simproc-editor' },

  { userId: 'u-jk', projectId: 'p-sim35', roleId: 'r-sim35-admin' },
  { userId: 'u-km', projectId: 'p-sim35', roleId: 'r-sim35-editor' },
  { userId: 'u-jy', projectId: 'p-sim35', roleId: 'r-sim35-viewer' },

  { userId: 'u-km', projectId: 'p-tfa', roleId: 'r-tfa-admin' },
  { userId: 'u-jy', projectId: 'p-tfa', roleId: 'r-tfa-editor' },
  { userId: 'u-jk', projectId: 'p-tfa', roleId: 'r-tfa-editor' },

  { userId: 'u-jy', projectId: 'p-ztna', roleId: 'r-ztna-admin' },
  { userId: 'u-jk', projectId: 'p-ztna', roleId: 'r-ztna-admin' },

  { userId: 'u-sy', projectId: 'p-girok', roleId: 'r-girok-admin' },
  { userId: 'u-sa', projectId: 'p-girok', roleId: 'r-girok-editor' },
  { userId: 'u-jk', projectId: 'p-girok', roleId: 'r-girok-viewer' },

  { userId: 'u-sy', projectId: 'p-paint', roleId: 'r-paint-admin' },
  { userId: 'u-jk', projectId: 'p-paint', roleId: 'r-paint-viewer' },

  { userId: 'u-jk', projectId: 'p-artpiad', roleId: 'r-artpiad-admin' },

  { userId: 'u-sa', projectId: 'p-myfi', roleId: 'r-myfi-admin' },
  { userId: 'u-jk', projectId: 'p-myfi', roleId: 'r-myfi-viewer' },

  { userId: 'u-sy', projectId: 'p-girokweb', roleId: 'r-girokweb-admin' },
  { userId: 'u-jk', projectId: 'p-girokweb', roleId: 'r-girokweb-viewer' },

  { userId: 'u-km', projectId: 'p-intra', roleId: 'r-intra-admin' },
  { userId: 'u-jk', projectId: 'p-intra', roleId: 'r-intra-viewer' },

  { userId: 'u-hr', projectId: 'p-mkt', roleId: 'r-mkt-admin' },
  { userId: 'u-jk', projectId: 'p-mkt', roleId: 'r-mkt-viewer' },
]

export function getRoleById(id: string): Role | undefined {
  return mockRoles.find((r) => r.id === id)
}

export function getMemberRole(projectId: string, userId: string): Role | undefined {
  const member = mockProjectMembers.find((m) => m.projectId === projectId && m.userId === userId)
  return member ? getRoleById(member.roleId) : undefined
}
