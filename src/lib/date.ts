// 업무 마감일 표시용 포맷 — 오늘/내일/어제는 상대 표기, 그 외엔 "M월 D일"
export function formatDueLabel(endDate: string, isDone: boolean): { label: string; urgent: boolean } {
  const end = new Date(`${endDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((end.getTime() - today.getTime()) / 86_400_000)

  let label: string
  if (diffDays === 0) label = '오늘'
  else if (diffDays === 1) label = '내일'
  else if (diffDays === -1) label = '어제'
  else label = `${end.getMonth() + 1}월 ${end.getDate()}일`

  const urgent = !isDone && diffDays <= 1
  return { label, urgent }
}

// 댓글 등록 시각 표시용 포맷 — 오늘이면 시:분만, 그 외엔 "M월 D일 시:분"
export function formatCommentTime(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const time = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const isToday = date.toDateString() === today.toDateString()
  return isToday ? `오늘 ${time}` : `${date.getMonth() + 1}월 ${date.getDate()}일 ${time}`
}
