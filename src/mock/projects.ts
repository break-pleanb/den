import type { Folder, Project } from './types'

// 폴더 (개인용 정리함 — CURRENT_USER 기준. 권한과 무관)
export const mockFolders: Folder[] = [
  { id: 'f-erta-sim', name: 'erta-sim', projectIds: ['p-sim-proc', 'p-sim35', 'p-tfa', 'p-ztna'] },
  { id: 'f-app', name: 'app', projectIds: ['p-app', 'p-girok', 'p-paint'] },
  { id: 'f-external', name: 'external', projectIds: ['p-artpiad', 'p-myfi'], collapsed: true },
]

export const mockProjects: Project[] = [
  // erta-sim 폴더
  { id: 'p-sim-proc', key: 'SIMPROC', name: '보안인증-조달등록', color: '#f59e0b', folderId: 'f-erta-sim', memberIds: ['u-jk', 'u-jy'] },
  { id: 'p-sim35', key: 'SIM35', name: 'Erta-SIM 3.5', color: '#8b5cf6', folderId: 'f-erta-sim', memberIds: ['u-jk', 'u-km', 'u-jy'] },
  { id: 'p-tfa', key: 'TFA', name: 'TFA 연동', color: '#ec4899', folderId: 'f-erta-sim', memberIds: ['u-km', 'u-jy'] },
  { id: 'p-ztna', key: 'ZTNA', name: 'ZTNA 인프라', color: '#0ea5e9', folderId: 'f-erta-sim', memberIds: ['u-jy'] },

  // app 폴더
  { id: 'p-app', key: 'APP', name: '모바일 앱 개편', color: '#6366f1', folderId: 'f-app', memberIds: ['u-jk', 'u-sy', 'u-km', 'u-hr'] },
  { id: 'p-girok', key: 'GIROK', name: 'Girok 게임', color: '#14b8a6', folderId: 'f-app', memberIds: ['u-sy', 'u-sa'] },
  { id: 'p-paint', key: 'PAINT', name: 'Paint Clash', color: '#ef4444', folderId: 'f-app', memberIds: ['u-sy'] },

  // external 폴더
  { id: 'p-artpiad', key: 'ARTPIAD', name: 'artpiad2026', color: '#22c55e', folderId: 'f-external', memberIds: ['u-jk'] },
  { id: 'p-myfi', key: 'MYFI', name: '마이파이', color: '#a855f7', folderId: 'f-external', memberIds: ['u-sa'] },

  // 미분류 (폴더에 배치되지 않음)
  { id: 'p-backend', key: 'BACKEND', name: '백엔드 마이그레이션', color: '#10b981', folderId: null, memberIds: ['u-jk', 'u-sa'] },
  { id: 'p-sim-sec', key: 'SIMSEC', name: 'Erta-SIM 보안인증', color: '#f59e0b', folderId: null, memberIds: ['u-jk', 'u-jy'] },
  { id: 'p-girokweb', key: 'GIROKWEB', name: 'Girok 웹뷰 리뉴얼', color: '#06b6d4', folderId: null, memberIds: ['u-sy'] },
  { id: 'p-intra', key: 'INTRA', name: '사내 인트라넷 개편', color: '#64748b', folderId: null, memberIds: ['u-km'] },
  { id: 'p-mkt', key: 'MKT', name: 'Q3 마케팅 캠페인', color: '#f97316', folderId: null, memberIds: ['u-hr'] },
]

// 즐겨찾기 (CURRENT_USER 기준, user_id x project_id). 폴더 배치와 무관하게 겹칠 수 있음
export const mockFavoriteProjectIds: string[] = ['p-app', 'p-backend', 'p-sim-sec']

export function getProjectByKey(key: string): Project | undefined {
  return mockProjects.find((p) => p.key === key)
}
