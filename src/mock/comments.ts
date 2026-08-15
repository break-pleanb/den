import type { Comment } from './types'

// 업무 댓글 — mentionUserIds는 본문 중 "@이름" 이 가리키는 사용자
export const mockComments: Comment[] = [
  {
    id: 'c-app142-1',
    taskId: 't-app-142',
    authorId: 'u-jk',
    body: '카카오/네이버 버튼 순서는 기존 안대로 가져가면 될까요?',
    mentionUserIds: [],
    createdAt: '2026-08-11T10:12:00',
  },
  {
    id: 'c-app142-2',
    taskId: 't-app-142',
    authorId: 'u-sy',
    body: '@정경호 네 기존 순서 유지하겠습니다. 대신 애플 로그인 버튼을 상단에 추가할게요.',
    mentionUserIds: ['u-jk'],
    createdAt: '2026-08-11T10:30:00',
  },
  {
    id: 'c-app142-3',
    taskId: 't-app-142',
    authorId: 'u-km',
    body: '리다이렉트 URI 쪽은 제가 확인 중입니다. 이번 주 내로 공유드릴게요.',
    mentionUserIds: [],
    createdAt: '2026-08-12T09:05:00',
  },
  {
    id: 'c-app142-4',
    taskId: 't-app-142',
    authorId: 'u-jk',
    body: '@신유진 @김민석 진행 상황 확인했습니다. 계속 진행해주세요.',
    mentionUserIds: ['u-sy', 'u-km'],
    createdAt: '2026-08-13T14:20:00',
  },
  {
    id: 'c-app144-1',
    taskId: 't-app-142-2',
    authorId: 'u-sy',
    body: '카카오 리다이렉트 URI 목록 정리했습니다. 확인 부탁드려요.',
    mentionUserIds: [],
    createdAt: '2026-08-13T11:00:00',
  },
]

export function getCommentsByTask(taskId: string): Comment[] {
  return mockComments.filter((c) => c.taskId === taskId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}
