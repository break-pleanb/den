import type { TaskPriority, TaskStatus } from '@/mock/types'

export const STATUS_ORDER: TaskStatus[] = ['todo', 'progress', 'review', 'done']

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: '할 일',
  progress: '진행 중',
  review: '검토',
  done: '완료',
}

export const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  todo: 'bg-status-todo-bg text-status-todo-fg',
  progress: 'bg-status-progress-bg text-status-progress-fg',
  review: 'bg-status-review-bg text-status-review-fg',
  done: 'bg-status-done-bg text-status-done-fg',
}

export const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  todo: 'bg-status-todo-fg',
  progress: 'bg-status-progress-fg',
  review: 'bg-status-review-fg',
  done: 'bg-status-done-fg',
}

export const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  urgent: 'text-priority-urgent',
  high: 'text-priority-high',
  medium: 'text-priority-medium',
  low: 'text-priority-low',
}
