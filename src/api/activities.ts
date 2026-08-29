import { http } from '@/lib/http'
import type { TaskActivity } from '@/mock/types'

export async function fetchTaskActivities(taskId: string): Promise<TaskActivity[]> {
  const { data } = await http.get<TaskActivity[]>(`/tasks/${taskId}/activities`)
  return data
}
