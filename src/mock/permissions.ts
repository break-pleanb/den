import type { ProjectMember, Role } from './types'

// 역할 — 프로젝트별 관리자/편집자/뷰어. 메뉴 권한은 역할에 묶임 (보기/편집 구분 없음)
export const mockRoles: Role[] = [
  { id: 'r-app-admin', projectId: 'p-app', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-app-editor', projectId: 'p-app', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-app-viewer', projectId: 'p-app', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-backend-admin', projectId: 'p-backend', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-backend-editor', projectId: 'p-backend', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-backend-viewer', projectId: 'p-backend', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-simsec-admin', projectId: 'p-sim-sec', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: false, messenger: true } },
  { id: 'r-simsec-editor', projectId: 'p-sim-sec', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: false, messenger: true } },
  { id: 'r-simsec-viewer', projectId: 'p-sim-sec', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: false, messenger: false } },

  { id: 'r-simproc-admin', projectId: 'p-sim-proc', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-simproc-editor', projectId: 'p-sim-proc', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-simproc-viewer', projectId: 'p-sim-proc', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-sim35-admin', projectId: 'p-sim35', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-sim35-editor', projectId: 'p-sim35', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-sim35-viewer', projectId: 'p-sim35', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-tfa-admin', projectId: 'p-tfa', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-tfa-editor', projectId: 'p-tfa', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-tfa-viewer', projectId: 'p-tfa', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-ztna-admin', projectId: 'p-ztna', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-ztna-editor', projectId: 'p-ztna', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-ztna-viewer', projectId: 'p-ztna', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-girok-admin', projectId: 'p-girok', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girok-editor', projectId: 'p-girok', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girok-viewer', projectId: 'p-girok', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-paint-admin', projectId: 'p-paint', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-paint-editor', projectId: 'p-paint', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-paint-viewer', projectId: 'p-paint', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-artpiad-admin', projectId: 'p-artpiad', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-artpiad-editor', projectId: 'p-artpiad', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-artpiad-viewer', projectId: 'p-artpiad', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-myfi-admin', projectId: 'p-myfi', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-myfi-editor', projectId: 'p-myfi', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-myfi-viewer', projectId: 'p-myfi', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-girokweb-admin', projectId: 'p-girokweb', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girokweb-editor', projectId: 'p-girokweb', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-girokweb-viewer', projectId: 'p-girokweb', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-intra-admin', projectId: 'p-intra', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-intra-editor', projectId: 'p-intra', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-intra-viewer', projectId: 'p-intra', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },

  { id: 'r-mkt-admin', projectId: 'p-mkt', name: '관리자', isAdmin: true, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-mkt-editor', projectId: 'p-mkt', name: '편집자', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: true } },
  { id: 'r-mkt-viewer', projectId: 'p-mkt', name: '뷰어', isAdmin: false, menuPermissions: { tasks: true, gantt: true, messenger: false } },
]

export const mockProjectMembers: ProjectMember[] = [
  { userId: 'u-jk', projectId: 'p-app', roleId: 'r-app-admin', invitedAt: '2025-11-03' },
  { userId: 'u-sy', projectId: 'p-app', roleId: 'r-app-editor', invitedAt: '2025-11-10' },
  { userId: 'u-km', projectId: 'p-app', roleId: 'r-app-editor', invitedAt: '2025-11-10' },
  { userId: 'u-hr', projectId: 'p-app', roleId: 'r-app-viewer', invitedAt: '2025-12-01' },

  { userId: 'u-jk', projectId: 'p-backend', roleId: 'r-backend-admin', invitedAt: '2025-10-15' },
  { userId: 'u-sa', projectId: 'p-backend', roleId: 'r-backend-editor', invitedAt: '2025-10-20' },

  { userId: 'u-jk', projectId: 'p-sim-sec', roleId: 'r-simsec-admin', invitedAt: '2025-09-01' },
  { userId: 'u-jy', projectId: 'p-sim-sec', roleId: 'r-simsec-editor', invitedAt: '2025-09-05' },

  { userId: 'u-jk', projectId: 'p-sim-proc', roleId: 'r-simproc-admin', invitedAt: '2025-09-01' },
  { userId: 'u-jy', projectId: 'p-sim-proc', roleId: 'r-simproc-editor', invitedAt: '2025-09-10' },

  { userId: 'u-jk', projectId: 'p-sim35', roleId: 'r-sim35-admin', invitedAt: '2025-08-20' },
  { userId: 'u-km', projectId: 'p-sim35', roleId: 'r-sim35-editor', invitedAt: '2025-08-25' },
  { userId: 'u-jy', projectId: 'p-sim35', roleId: 'r-sim35-viewer', invitedAt: '2025-09-02' },

  { userId: 'u-km', projectId: 'p-tfa', roleId: 'r-tfa-admin', invitedAt: '2025-12-10' },
  { userId: 'u-jy', projectId: 'p-tfa', roleId: 'r-tfa-editor', invitedAt: '2025-12-12' },
  { userId: 'u-jk', projectId: 'p-tfa', roleId: 'r-tfa-editor', invitedAt: '2025-12-15' },

  { userId: 'u-jy', projectId: 'p-ztna', roleId: 'r-ztna-admin', invitedAt: '2026-01-05' },
  { userId: 'u-jk', projectId: 'p-ztna', roleId: 'r-ztna-admin', invitedAt: '2026-01-05' },

  { userId: 'u-sy', projectId: 'p-girok', roleId: 'r-girok-admin', invitedAt: '2025-07-01' },
  { userId: 'u-sa', projectId: 'p-girok', roleId: 'r-girok-editor', invitedAt: '2025-07-10' },
  { userId: 'u-jk', projectId: 'p-girok', roleId: 'r-girok-viewer', invitedAt: '2025-07-15' },

  { userId: 'u-sy', projectId: 'p-paint', roleId: 'r-paint-admin', invitedAt: '2025-06-01' },
  { userId: 'u-jk', projectId: 'p-paint', roleId: 'r-paint-viewer', invitedAt: '2025-06-10' },

  { userId: 'u-jk', projectId: 'p-artpiad', roleId: 'r-artpiad-admin', invitedAt: '2025-05-01' },

  { userId: 'u-sa', projectId: 'p-myfi', roleId: 'r-myfi-admin', invitedAt: '2025-04-01' },
  { userId: 'u-jk', projectId: 'p-myfi', roleId: 'r-myfi-viewer', invitedAt: '2025-04-15' },

  { userId: 'u-sy', projectId: 'p-girokweb', roleId: 'r-girokweb-admin', invitedAt: '2025-03-01' },
  { userId: 'u-jk', projectId: 'p-girokweb', roleId: 'r-girokweb-viewer', invitedAt: '2025-03-15' },

  { userId: 'u-km', projectId: 'p-intra', roleId: 'r-intra-admin', invitedAt: '2025-02-01' },
  { userId: 'u-jk', projectId: 'p-intra', roleId: 'r-intra-viewer', invitedAt: '2025-02-15' },

  { userId: 'u-hr', projectId: 'p-mkt', roleId: 'r-mkt-admin', invitedAt: '2026-02-01' },
  { userId: 'u-jk', projectId: 'p-mkt', roleId: 'r-mkt-viewer', invitedAt: '2026-02-10' },
]

export function getRoleById(id: string): Role | undefined {
  return mockRoles.find((r) => r.id === id)
}

export function getMemberRole(projectId: string, userId: string): Role | undefined {
  const member = mockProjectMembers.find((m) => m.projectId === projectId && m.userId === userId)
  return member ? getRoleById(member.roleId) : undefined
}
