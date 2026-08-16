import type { Message } from './types'

// 메신저 메시지 — 채널별 대화 이력. mock/channels.ts의 unreadCount와 맞춰
// 최근 몇 개는 "아직 안 읽은 것"이라는 서사로 배치했다
export const mockMessages: Message[] = [
  // c-app-general
  { id: 'm-app-g-1', channelId: 'c-app-general', authorId: 'u-jk', body: '다들 좋은 아침입니다. 오늘 오후 3시 스프린트 리뷰 잊지 마세요.', mentionUserIds: [], createdAt: '2026-08-15T09:02:00' },
  { id: 'm-app-g-2', channelId: 'c-app-general', authorId: 'u-sy', body: '넵! SNS 로그인 화면 시안 오전 중으로 올려드릴게요.', mentionUserIds: [], createdAt: '2026-08-15T09:05:00' },
  { id: 'm-app-g-3', channelId: 'c-app-general', authorId: 'u-km', body: '리다이렉트 URI 관련해서 백엔드 쪽 작업 마무리했습니다.', mentionUserIds: [], createdAt: '2026-08-15T11:20:00' },
  { id: 'm-app-g-4', channelId: 'c-app-general', authorId: 'u-hr', body: '@정경호 QR 투표 기능 테스트 케이스 정리해서 공유드렸어요. 확인 부탁드립니다.', mentionUserIds: ['u-jk'], createdAt: '2026-08-15T15:40:00' },
  { id: 'm-app-g-5', channelId: 'c-app-general', authorId: 'u-sy', body: '푸시 알림 아이콘 배지 색상 인디고로 통일했습니다!', mentionUserIds: [], createdAt: '2026-08-16T08:12:00' },
  { id: 'm-app-g-6', channelId: 'c-app-general', authorId: 'u-km', body: '오늘 오후에 스테이징 배포 한 번 더 돌릴 예정입니다.', mentionUserIds: [], createdAt: '2026-08-16T08:30:00' },
  { id: 'm-app-g-7', channelId: 'c-app-general', authorId: 'u-hr', body: '넵 확인했습니다. 배포 끝나면 회귀 테스트 바로 시작할게요.', mentionUserIds: [], createdAt: '2026-08-16T08:33:00' },

  // c-app-design
  { id: 'm-app-d-1', channelId: 'c-app-design', authorId: 'u-jk', body: '애플 로그인 버튼 아이콘 크기만 살짝 줄여주실 수 있을까요?', mentionUserIds: [], createdAt: '2026-08-14T13:10:00' },
  { id: 'm-app-d-2', channelId: 'c-app-design', authorId: 'u-sy', body: '넵 20px로 맞췄습니다. 반영본 다시 올려드릴게요.', mentionUserIds: [], createdAt: '2026-08-14T13:32:00' },
  { id: 'm-app-d-3', channelId: 'c-app-design', authorId: 'u-jk', body: '좋네요, 감사합니다 👍', mentionUserIds: [], createdAt: '2026-08-14T13:40:00' },

  // c-app-bugs
  { id: 'm-app-b-1', channelId: 'c-app-bugs', authorId: 'u-hr', body: 'iOS 15에서 QR 스캔 화면 진입 시 크래시가 재현됩니다.', mentionUserIds: [], createdAt: '2026-08-13T16:02:00' },
  { id: 'm-app-b-2', channelId: 'c-app-bugs', authorId: 'u-km', body: '카메라 권한 콜백 쪽 문제로 보이네요. 로그 확인해서 오늘 중으로 픽스하겠습니다.', mentionUserIds: [], createdAt: '2026-08-13T16:15:00' },
  { id: 'm-app-b-3', channelId: 'c-app-bugs', authorId: 'u-km', body: '수정 완료했습니다. 재현 확인 부탁드려요.', mentionUserIds: [], createdAt: '2026-08-14T10:05:00' },
  { id: 'm-app-b-4', channelId: 'c-app-bugs', authorId: 'u-hr', body: '재현 안 됩니다. 클로즈 처리할게요!', mentionUserIds: [], createdAt: '2026-08-14T11:30:00' },

  // c-app-dm-sy (1:1)
  { id: 'm-app-dm-sy-1', channelId: 'c-app-dm-sy', authorId: 'u-sy', body: '경호님, 내일 디자인 QA 시간 괜찮으실까요?', mentionUserIds: [], createdAt: '2026-08-15T18:02:00' },
  { id: 'm-app-dm-sy-2', channelId: 'c-app-dm-sy', authorId: 'u-jk', body: '네 오후 2시 어떠세요?', mentionUserIds: [], createdAt: '2026-08-15T18:10:00' },
  { id: 'm-app-dm-sy-3', channelId: 'c-app-dm-sy', authorId: 'u-sy', body: '좋습니다! 그때 뵐게요.', mentionUserIds: [], createdAt: '2026-08-15T18:11:00' },
  { id: 'm-app-dm-sy-4', channelId: 'c-app-dm-sy', authorId: 'u-sy', body: '아 그리고 온보딩 플로우 시안도 같이 봐주시면 좋을 것 같아요.', mentionUserIds: [], createdAt: '2026-08-16T08:50:00' },
  { id: 'm-app-dm-sy-5', channelId: 'c-app-dm-sy', authorId: 'u-sy', body: '링크는 회의 전에 올려둘게요 :)', mentionUserIds: [], createdAt: '2026-08-16T08:51:00' },

  // c-backend-general
  { id: 'm-backend-g-1', channelId: 'c-backend-general', authorId: 'u-sa', body: 'Redis 캐시 붙이고 나니 조회 API 응답이 확실히 빨라졌어요.', mentionUserIds: [], createdAt: '2026-08-12T14:20:00' },
  { id: 'm-backend-g-2', channelId: 'c-backend-general', authorId: 'u-jk', body: '오 좋네요. TTL은 어떻게 잡으셨어요?', mentionUserIds: [], createdAt: '2026-08-12T14:25:00' },
  { id: 'm-backend-g-3', channelId: 'c-backend-general', authorId: 'u-sa', body: '일단 5분으로 두고 지켜보고 있습니다. 필요하면 조정할게요.', mentionUserIds: [], createdAt: '2026-08-12T14:26:00' },

  // c-simsec-general
  { id: 'm-simsec-g-1', channelId: 'c-simsec-general', authorId: 'u-jy', body: '망분리 아키텍처 검토 문서 초안 공유드립니다.', mentionUserIds: [], createdAt: '2026-08-16T07:40:00' },
  { id: 'm-simsec-g-2', channelId: 'c-simsec-general', authorId: 'u-jy', body: '금요일까지 피드백 주시면 반영해서 조달청에 제출하겠습니다.', mentionUserIds: [], createdAt: '2026-08-16T07:41:00' },

  // c-simsec-dm-jy
  { id: 'm-simsec-dm-jy-1', channelId: 'c-simsec-dm-jy', authorId: 'u-jk', body: '준영님 보안 인증 서류 진행 상황 어떤가요?', mentionUserIds: [], createdAt: '2026-08-11T10:00:00' },
  { id: 'm-simsec-dm-jy-2', channelId: 'c-simsec-dm-jy', authorId: 'u-jy', body: '이번 주 내로 1차 초안 정리해서 드리겠습니다.', mentionUserIds: [], createdAt: '2026-08-11T10:05:00' },
]

export function getMessagesByChannel(channelId: string): Message[] {
  // 시드 데이터는 타임존 없는 로컬 시각 문자열, 실시간으로 추가되는 메시지는
  // new Date().toISOString()(UTC, "Z" 접미사)을 쓰므로 문자열 비교(localeCompare)는
  // 두 형식이 섞이면 순서가 어긋난다. 실제 시각(타임스탬프)으로 비교해야 한다
  return mockMessages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

// 실시간 시뮬레이션에서 사용할 짧은 캐주얼/업무 톤 답장 후보
const AUTO_REPLY_POOL = [
  '네 확인했습니다!',
  '좋습니다 👍',
  '지금 바로 볼게요.',
  '넵, 진행하겠습니다.',
  '오케이, 반영할게요.',
  '조금 더 살펴보고 답변드릴게요.',
  '감사합니다!',
  '음, 잠시만요. 확인 중입니다.',
  '네 맞아요, 그렇게 가시죠.',
  '이견 없습니다 :)',
  '알겠습니다. 오늘 중으로 처리할게요.',
  '오 좋은 아이디어네요.',
]

export function pickAutoReplyBody(): string {
  return AUTO_REPLY_POOL[Math.floor(Math.random() * AUTO_REPLY_POOL.length)]
}
