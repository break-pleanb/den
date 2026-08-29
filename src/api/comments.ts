import { http } from '@/lib/http'
import type { Comment } from '@/mock/types'

export async function fetchCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const { data } = await http.get<Comment[]>(`/tasks/${taskId}/comments`)
  return data
}

export async function addComment(taskId: string, body: string, mentionUserIds: string[]): Promise<Comment> {
  const { data } = await http.post<Comment>(`/tasks/${taskId}/comments`, { body, mentionUserIds })
  return data
}
