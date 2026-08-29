import axios from 'axios'
import { http } from '@/lib/http'
import type { Folder, Project, Role } from '@/mock/types'

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await http.get<Project[]>('/projects')
  return data
}

export async function createProject(name: string, folderId: string | null = null): Promise<Project> {
  const { data } = await http.post<Project>('/projects', { name, folderId })
  return data
}

export async function fetchProjectByKey(key: string): Promise<Project | undefined> {
  try {
    const { data } = await http.get<Project>(`/projects/${key}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function fetchMyProjectRoles(): Promise<Record<string, Role | undefined>> {
  const { data } = await http.get<Record<string, Role | undefined>>('/me/project-roles')
  return data
}

export interface ProjectStats {
  projectId: string
  total: number
  todo: number
  progress: number
  review: number
  done: number
}

// 전체 프로젝트 홈 카드의 진행 현황 — 서버가 프로젝트별로 집계해 반환한다
export async function fetchProjectStats(): Promise<ProjectStats[]> {
  const { data } = await http.get<ProjectStats[]>('/me/project-stats')
  return data
}

export async function fetchFolders(): Promise<Folder[]> {
  const { data } = await http.get<Folder[]>('/folders')
  return data
}

export async function createFolder(name: string): Promise<Folder> {
  const { data } = await http.post<Folder>('/folders', { name })
  return data
}

export async function moveProjectToFolder(projectKey: string, folderId: string | null): Promise<Project | undefined> {
  try {
    const { data } = await http.patch<Project>(`/projects/${projectKey}/placement`, { folderId })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function fetchFavoriteProjectIds(): Promise<string[]> {
  const { data } = await http.get<string[]>('/favorites')
  return data
}

export async function toggleFavoriteProject(projectKey: string): Promise<{ isFavorite: boolean }> {
  const { data } = await http.post<{ isFavorite: boolean }>(`/projects/${projectKey}/favorite`)
  return data
}
