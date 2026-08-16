import { computed, nextTick, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { User } from '@/mock/types'

// 댓글·메신저 입력창에서 "@이름" 자동완성을 처리하는 공용 로직.
// textareaRef는 호출하는 컴포넌트가 useTemplateRef로 직접 만들어 넘긴다
// (컴포넌트 쪽에서 ref="..."로 바인딩해야 Volar가 템플릿 참조로 타입 추론한다).
export function useMentionInput(
  mentionOptions: MaybeRefOrGetter<User[]>,
  textareaRef: Ref<HTMLTextAreaElement | null>,
) {
  const draft = ref('')
  const mentionActive = ref(false)
  const mentionQuery = ref('')
  const pickedMentions = ref(new Map<string, string>()) // 멘션한 이름 -> userId

  const mentionCandidates = computed(() => {
    const q = mentionQuery.value.toLowerCase()
    return toValue(mentionOptions).filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6)
  })

  // @ 뒤에 이어지는 검색어를 추출해 멘션 후보 목록을 띄운다
  function activeMentionMatch() {
    const el = textareaRef.value
    if (!el) return null
    const cursor = el.selectionStart ?? draft.value.length
    const upToCursor = draft.value.slice(0, cursor)
    const match = /(?:^|\s)@([^\s@]*)$/.exec(upToCursor)
    return match ? { match, cursor } : null
  }

  function onInput() {
    const found = activeMentionMatch()
    mentionActive.value = !!found
    mentionQuery.value = found?.match[1] ?? ''
  }

  function pickMention(user: User) {
    const found = activeMentionMatch()
    const el = textareaRef.value
    if (!found || !el) return
    const { match, cursor } = found
    const start = match.index + (match[0].startsWith(' ') ? 1 : 0)
    const before = draft.value.slice(0, start)
    const after = draft.value.slice(cursor)
    const inserted = `@${user.name} `
    draft.value = `${before}${inserted}${after}`
    pickedMentions.value.set(user.name, user.id)
    mentionActive.value = false
    nextTick(() => {
      const pos = before.length + inserted.length
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  function consumeMentionIds(body: string): string[] {
    return [...pickedMentions.value.entries()]
      .filter(([name]) => body.includes(`@${name}`))
      .map(([, id]) => id)
  }

  function reset() {
    draft.value = ''
    pickedMentions.value = new Map()
    mentionActive.value = false
  }

  return { draft, mentionActive, mentionCandidates, onInput, pickMention, consumeMentionIds, reset }
}

// 본문 중 "@이름" 부분을 강조 표시용 조각으로 분리한다
export function splitMentionText(
  body: string,
  mentionUserIds: string[],
  usersById: Record<string, User | undefined>,
) {
  const names = mentionUserIds.map((id) => usersById[id]?.name).filter((n): n is string => !!n)
  if (!names.length) return [{ text: body, mention: false }]
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(@(?:${escaped.join('|')}))`, 'g')
  return body
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, mention: names.some((n) => part === `@${n}`) }))
}
