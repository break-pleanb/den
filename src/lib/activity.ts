import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/constants'
import { formatMonthDay } from '@/lib/date'
import type { TaskActivity, User } from '@/mock/types'

// 한글 받침에 따라 "로"/"으로" 조사를 고른다 (받침 없음 또는 'ㄹ' 받침이면 "로")
function ro(word: string): string {
  const last = word.charCodeAt(word.length - 1) - 0xac00
  if (last < 0 || last > 11171) return '로'
  const jongseong = last % 28
  return jongseong === 0 || jongseong === 8 ? '로' : '으로'
}

// 백엔드가 상태/우선순위 코드를 대문자('TODO')로 보낼 수도 있어 소문자로 정규화한 뒤 매핑한다
function statusLabel(raw: string): string {
  return STATUS_LABEL[raw.toLowerCase() as keyof typeof STATUS_LABEL] ?? raw
}

function priorityLabel(raw: string): string {
  return PRIORITY_LABEL[raw.toLowerCase() as keyof typeof PRIORITY_LABEL] ?? raw
}

function assigneeNames(value: string, usersById: Record<string, User>): string[] {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => usersById[id]?.name ?? '알 수 없음')
}

// 업무 상세 "변경 이력" 섹션 문구 — 담당자·시각을 뺀 변경 내용만 (예: "상태를 할 일 → 진행 중으로 변경")
export function formatActivityMessage(activity: TaskActivity, usersById: Record<string, User>): string {
  const { field, oldValue, newValue } = activity

  switch (field) {
    case 'status': {
      const to = statusLabel(newValue)
      return `상태를 ${statusLabel(oldValue)} → ${to}${ro(to)} 변경`
    }
    case 'priority': {
      const to = priorityLabel(newValue)
      return `우선순위를 ${priorityLabel(oldValue)} → ${to}${ro(to)} 변경`
    }
    case 'title':
      return `제목을 "${oldValue}"에서 "${newValue}"${ro(newValue)} 변경`
    case 'startDate':
      return `시작일을 ${formatMonthDay(oldValue)} → ${formatMonthDay(newValue)}${ro(formatMonthDay(newValue))} 변경`
    case 'endDate':
      return `마감일을 ${formatMonthDay(oldValue)} → ${formatMonthDay(newValue)}${ro(formatMonthDay(newValue))} 변경`
    case 'progress':
      return `진행률을 ${oldValue}% → ${newValue}%로 변경`
    case 'isPrivate':
      return newValue === 'true' ? '업무를 비공개로 전환' : '업무를 공개로 전환'
    case 'assignees': {
      const before = assigneeNames(oldValue, usersById)
      const after = assigneeNames(newValue, usersById)
      const added = after.filter((name) => !before.includes(name))
      const removed = before.filter((name) => !after.includes(name))
      const parts: string[] = []
      if (added.length) parts.push(`담당자에 ${added.join(', ')}님 추가`)
      if (removed.length) parts.push(`담당자에서 ${removed.join(', ')}님 제외`)
      return parts.length ? parts.join(' · ') : '담당자 변경'
    }
    case 'dependencies': {
      const from = oldValue.trim() || '없음'
      const to = newValue.trim() || '없음'
      return `선행 업무를 ${from} → ${to}${ro(to)} 변경`
    }
    default:
      return '업무 변경'
  }
}
