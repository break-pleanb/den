import type { User } from './types'

export const mockUsers: User[] = [
  {
    id: 'u-jk',
    name: '정경호',
    email: 'jk.jung@pleanb.com',
    initials: 'JK',
    avatarGradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    title: '프로젝트 리드',
  },
  {
    id: 'u-sy',
    name: '신유진',
    email: 'yj.shin@pleanb.com',
    initials: 'SY',
    avatarGradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    title: '프론트엔드 개발자',
  },
  {
    id: 'u-km',
    name: '김민석',
    email: 'ms.kim@pleanb.com',
    initials: 'KM',
    avatarGradient: 'linear-gradient(135deg,#10b981,#059669)',
    title: '백엔드 개발자',
  },
  {
    id: 'u-hr',
    name: '한소라',
    email: 'sr.han@pleanb.com',
    initials: 'HR',
    avatarGradient: 'linear-gradient(135deg,#ec4899,#db2777)',
    title: 'QA 엔지니어',
  },
  {
    id: 'u-sa',
    name: '이수아',
    email: 'sa.lee@pleanb.com',
    initials: 'SA',
    avatarGradient: 'linear-gradient(135deg,#14b8a6,#0ea5e9)',
    title: '백엔드 개발자',
  },
  {
    id: 'u-jy',
    name: '박준영',
    email: 'jy.park@pleanb.com',
    initials: 'JY',
    avatarGradient: 'linear-gradient(135deg,#a855f7,#7c3aed)',
    title: '보안 엔지니어',
  },
]

// 목업 단계의 "로그인 사용자" — 실제 로그인 붙기 전까지 항상 이 사용자로 동작
export const CURRENT_USER_ID = 'u-jk'

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id)
}
