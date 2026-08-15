import type { Folder, Project } from './types'

// 폴더 (개인용 정리함 — CURRENT_USER 기준. 권한과 무관). 소속 프로젝트는 Project.folderId로 판단한다
export const mockFolders: Folder[] = [
  { id: 'f-erta-sim', name: 'erta-sim' },
  { id: 'f-app', name: 'app' },
  { id: 'f-external', name: 'external', collapsed: true },
]

export const mockProjects: Project[] = [
  // erta-sim 폴더
  {
    id: 'p-sim-proc',
    key: 'SIMPROC',
    name: '보안인증-조달등록',
    description: '공공기관 조달 등록을 위한 보안 인증 문서 작업 및 심사 대응.',
    color: '#f59e0b',
    folderId: 'f-erta-sim',
    memberIds: ['u-jk', 'u-jy'],
  },
  {
    id: 'p-sim35',
    key: 'SIM35',
    name: 'Erta-SIM 3.5',
    description: 'SIM 보안 솔루션 3.5 버전 기능 개선 및 릴리스 준비.',
    color: '#8b5cf6',
    folderId: 'f-erta-sim',
    memberIds: ['u-jk', 'u-km', 'u-jy'],
  },
  {
    id: 'p-tfa',
    key: 'TFA',
    name: 'TFA 연동',
    description: '2단계 인증(TFA) 모듈 타사 서비스 연동 작업.',
    color: '#ec4899',
    folderId: 'f-erta-sim',
    memberIds: ['u-jk', 'u-km', 'u-jy'],
  },
  {
    id: 'p-ztna',
    key: 'ZTNA',
    name: 'ZTNA 인프라',
    description: 'Guacamole 기반 RDP 세션 레코딩 및 ZTNA 게이트웨이 구축.',
    color: '#0ea5e9',
    folderId: 'f-erta-sim',
    memberIds: ['u-jk', 'u-jy'],
  },

  // app 폴더
  {
    id: 'p-app',
    key: 'APP',
    name: '모바일 앱 개편',
    description: 'Flutter + React WebView 하이브리드 앱. SNS 로그인, 푸시 알림, QR 투표 기능 개편.',
    color: '#6366f1',
    folderId: 'f-app',
    memberIds: ['u-jk', 'u-sy', 'u-km', 'u-hr'],
  },
  {
    id: 'p-girok',
    key: 'GIROK',
    name: 'Girok 게임',
    description: '캐주얼 퍼즐 게임 Girok의 신규 스테이지 및 라이브 운영 업무.',
    color: '#14b8a6',
    folderId: 'f-app',
    memberIds: ['u-jk', 'u-sy', 'u-sa'],
  },
  {
    id: 'p-paint',
    key: 'PAINT',
    name: 'Paint Clash',
    description: '실시간 대전형 페인트 슈팅 게임의 밸런스 조정과 매칭 서버 안정화.',
    color: '#ef4444',
    folderId: 'f-app',
    memberIds: ['u-jk', 'u-sy'],
  },

  // external 폴더
  {
    id: 'p-artpiad',
    key: 'ARTPIAD',
    name: 'artpiad2026',
    description: '2026 아트피아드 전시 신청·결제 플랫폼 구축.',
    color: '#22c55e',
    folderId: 'f-external',
    memberIds: ['u-jk'],
  },
  {
    id: 'p-myfi',
    key: 'MYFI',
    name: '마이파이',
    description: '알뜰폰 요금제 비교·가입 서비스 리뉴얼.',
    color: '#a855f7',
    folderId: 'f-external',
    memberIds: ['u-jk', 'u-sa'],
  },

  // 미분류 (폴더에 배치되지 않음)
  {
    id: 'p-backend',
    key: 'BACKEND',
    name: '백엔드 마이그레이션',
    description: 'Spring Boot 3 + PostgreSQL 전환. WebFlux에서 MVC로 재설계 및 Redis 캐시 도입.',
    color: '#10b981',
    folderId: null,
    memberIds: ['u-jk', 'u-sa'],
  },
  {
    id: 'p-sim-sec',
    key: 'SIMSEC',
    name: 'Erta-SIM 보안인증',
    description: '조달청 보안 인증 서류 준비와 망분리 아키텍처 검토.',
    color: '#f59e0b',
    folderId: null,
    memberIds: ['u-jk', 'u-jy'],
  },
  {
    id: 'p-girokweb',
    key: 'GIROKWEB',
    name: 'Girok 웹뷰 리뉴얼',
    description: 'Girok 앱 내 웹뷰 랜딩·이벤트 페이지 리디자인 및 성능 개선.',
    color: '#06b6d4',
    folderId: null,
    memberIds: ['u-jk', 'u-sy'],
  },
  {
    id: 'p-intra',
    key: 'INTRA',
    name: '사내 인트라넷 개편',
    description: '전자결재·조직도·공지사항을 통합한 사내 인트라넷 재구축.',
    color: '#64748b',
    folderId: null,
    memberIds: ['u-jk', 'u-km'],
  },
  {
    id: 'p-mkt',
    key: 'MKT',
    name: 'Q3 마케팅 캠페인',
    description: '3분기 신규 유저 획득을 위한 인플루언서 협업 및 랜딩페이지 캠페인.',
    color: '#f97316',
    folderId: null,
    memberIds: ['u-jk', 'u-hr'],
  },
]

// 즐겨찾기 (CURRENT_USER 기준, user_id x project_id). 폴더 배치와 무관하게 겹칠 수 있음
export const mockFavoriteProjectIds: string[] = ['p-app', 'p-backend', 'p-sim-sec']

export function getProjectByKey(key: string): Project | undefined {
  return mockProjects.find((p) => p.key === key)
}
