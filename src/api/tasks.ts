import axios from 'axios'
import { http } from '@/lib/http'
import type { Tag, Task, TaskPriority, TaskStatus } from '@/mock/types'

export interface TaskListFilters {
  status?: TaskStatus[]
  assignee?: string[]
  priority?: TaskPriority[]
  tag?: string[]
  q?: string
}

export interface TaskListParams extends TaskListFilters {
  page?: number
  size?: number
}

export interface TaskListResult {
  items: Task[]
  total: number
  page: number
  size: number
}

function toQueryParams(params: TaskListParams) {
  return {
    status: params.status?.length ? params.status.join(',') : undefined,
    assignee: params.assignee?.length ? params.assignee.join(',') : undefined,
    priority: params.priority?.length ? params.priority.join(',') : undefined,
    tag: params.tag?.length ? params.tag.join(',') : undefined,
    q: params.q || undefined,
    page: params.page,
    size: params.size,
  }
}

// 업무 리스트 화면용 — 필터·페이지네이션을 서버에 위임한다 (URL 쿼리 → 이 params로 그대로 전달)
export async function fetchTasks(projectKey: string, params: TaskListParams = {}): Promise<TaskListResult> {
  const { data } = await http.get<TaskListResult>(`/projects/${projectKey}/tasks`, { params: toQueryParams(params) })
  return data
}

// 부모/하위업무/의존성 관계 파악·순환 참조 검사용 — 백엔드에 "하위업무 목록"·"의존성 그래프"
// 전용 엔드포인트가 없어, 목록 엔드포인트를 페이지네이션 없이(큰 size) 호출해 재사용한다.
export async function fetchAllProjectTasks(projectKey: string, filters: TaskListFilters = {}): Promise<Task[]> {
  const { items } = await fetchTasks(projectKey, { ...filters, page: undefined, size: 1000 })
  return items
}

export interface CreateTaskInput {
  title: string
  status?: TaskStatus
  priority?: TaskPriority
  startDate?: string
  endDate?: string
  assigneeIds?: string[]
  tagIds?: string[]
  isPrivate?: boolean
}

export async function createTask(projectKey: string, input: CreateTaskInput): Promise<Task> {
  const { data } = await http.post<Task>(`/projects/${projectKey}/tasks`, input)
  return data
}

export async function fetchTaskById(taskId: string): Promise<Task | undefined> {
  try {
    const { data } = await http.get<Task>(`/tasks/${taskId}`)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function fetchSubtaskCount(taskId: string): Promise<number> {
  const { data } = await http.get<number>(`/tasks/${taskId}/subtask-count`)
  return data
}

export async function createSubtask(parentId: string, title: string): Promise<Task> {
  const { data } = await http.post<Task>(`/tasks/${parentId}/subtasks`, { title })
  return data
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | undefined> {
  try {
    const { data } = await http.patch<Task>(`/tasks/${taskId}/status`, { status })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'priority' | 'startDate' | 'endDate' | 'progress' | 'isPrivate'>>

export async function updateTask(taskId: string, patch: TaskPatch): Promise<Task | undefined> {
  try {
    const { data } = await http.patch<Task>(`/tasks/${taskId}`, patch)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]): Promise<Task | undefined> {
  try {
    const { data } = await http.patch<Task>(`/tasks/${taskId}/assignees`, { assigneeIds })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function updateTaskDependencies(taskId: string, dependencyIds: string[]): Promise<Task | undefined> {
  try {
    const { data } = await http.patch<Task>(`/tasks/${taskId}/dependencies`, { dependencyIds })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return undefined
    throw error
  }
}

export async function fetchTagsByProjectKey(projectKey: string): Promise<Tag[]> {
  const { data } = await http.get<Tag[]>(`/projects/${projectKey}/tags`)
  return data
}

// 사이드바 "내 업무" 배지
export async function fetchMyTaskCount(): Promise<number> {
  const { data } = await http.get<number>('/me/task-count')
  return data
}
