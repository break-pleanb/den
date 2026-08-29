import { http } from '@/lib/http'
import type { MenuKey, ProjectMember, Role } from '@/mock/types'

export async function fetchRolesByProjectKey(projectKey: string): Promise<Role[]> {
  const { data } = await http.get<Role[]>(`/projects/${projectKey}/roles`)
  return data
}

export async function fetchProjectMembers(projectKey: string): Promise<ProjectMember[]> {
  const { data } = await http.get<ProjectMember[]>(`/projects/${projectKey}/members`)
  return data
}

export async function fetchProjectMemberRoles(projectKey: string): Promise<Record<string, Role | undefined>> {
  const { data } = await http.get<Record<string, Role | undefined>>(`/projects/${projectKey}/members/roles`)
  return data
}

export async function fetchMenuPermissions(projectKey: string): Promise<Record<MenuKey, boolean>> {
  const { data } = await http.get<Record<MenuKey, boolean>>(`/projects/${projectKey}/menu-permissions`)
  return data
}

// 신규 계정을 만들지 않는다 — 이미 존재하는 사용자(userId)를 프로젝트+역할에 연결한다
export async function inviteProjectMember(projectKey: string, userId: string, roleId: string): Promise<ProjectMember> {
  const { data } = await http.post<ProjectMember>(`/projects/${projectKey}/members`, { userId, roleId })
  return data
}

export async function updateProjectMemberRole(projectKey: string, userId: string, roleId: string): Promise<void> {
  await http.patch(`/projects/${projectKey}/members/${userId}`, { roleId })
}

export async function removeProjectMember(projectKey: string, userId: string): Promise<void> {
  await http.delete(`/projects/${projectKey}/members/${userId}`)
}

export async function updateRoleMenuPermission(roleId: string, menuKey: MenuKey, value: boolean): Promise<void> {
  await http.patch(`/roles/${roleId}/menu-permissions`, { menuKey, value })
}
