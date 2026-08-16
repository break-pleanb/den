import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { AtSign, Clock, MessageSquare, RefreshCw, UserPlus, Users } from '@lucide/vue'
import type { AppNotification, NotificationType } from '@/mock/types'

export const NOTIFICATION_TYPE_ORDER: NotificationType[] = [
  'task_assigned',
  'task_comment',
  'task_mention',
  'task_due_soon',
  'task_status_changed',
  'channel_message',
  'project_invited',
]

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  task_assigned: '업무 배정',
  task_comment: '댓글',
  task_mention: '멘션',
  task_due_soon: '마감 임박',
  task_status_changed: '상태 변경',
  channel_message: '메시지',
  project_invited: '프로젝트 초대',
}

export const NOTIFICATION_TYPE_ICON: Record<NotificationType, Component> = {
  task_assigned: UserPlus,
  task_comment: MessageSquare,
  task_mention: AtSign,
  task_due_soon: Clock,
  task_status_changed: RefreshCw,
  channel_message: MessageSquare,
  project_invited: Users,
}

// 알림 클릭 시 이동할 위치 — 업무 알림은 업무 상세, 메시지 알림은 해당 채널, 그 외엔 프로젝트 업무 목록
export function notificationRoute(n: AppNotification): RouteLocationRaw | null {
  if (!n.projectKey) return null
  if (n.linkTaskId) {
    return {
      name: 'task-detail',
      params: { projectKey: n.projectKey, taskId: n.linkTaskId },
      query: { view: 'list' },
    }
  }
  if (n.linkChannelId) {
    return { name: 'messenger', params: { projectKey: n.projectKey, channelId: n.linkChannelId } }
  }
  return { name: 'tasks', params: { projectKey: n.projectKey }, query: { view: 'list' } }
}
