import { http } from '@/lib/http'
import type { User } from '@/mock/types'

// 멘션·담당자 선택용 — 전체 사용자가 아닌 이 프로젝트 멤버만 후보로 반환한다
export async function fetchProjectUsers(projectKey: string): Promise<User[]> {
  const { data } = await http.get<User[]>(`/projects/${projectKey}/users`)
  return data
}
