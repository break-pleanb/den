import { http } from '@/lib/http'
import type { User } from '@/mock/types'

// 멘션·담당자 선택용 — 전체 사용자가 아닌 이 프로젝트 멤버만 후보로 반환한다
export async function fetchProjectUsers(projectKey: string): Promise<User[]> {
  const { data } = await http.get<User[]>(`/projects/${projectKey}/users`)
  return data
}

// 멤버 초대 화면에서 아직 프로젝트 멤버가 아닌 기존 계정을 찾을 때 쓴다 (멘션·담당자 선택엔 쓰지 않음).
// ProjectsHomePage의 카드 아바타 매핑도 이 함수를 q=''로 호출해 재사용한다 — 프로젝트마다
// 개별 조회하는 대신 전체 사용자를 한 번만 받아오기 위함 (API-SPEC.md엔 q가 필수로 적혀 있어,
// 빈 문자열 호출 시 백엔드가 전체 목록을 반환하는지 확인이 필요하다).
export async function searchUsers(q: string): Promise<User[]> {
  const { data } = await http.get<User[]>('/users', { params: { q } })
  return data
}
