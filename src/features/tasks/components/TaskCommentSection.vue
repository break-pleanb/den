<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Send } from '@lucide/vue'
import { formatCommentTime } from '@/lib/date'
import type { Comment, User } from '@/mock/types'

const props = defineProps<{
  comments: Comment[]
  usersById: Record<string, User>
  mentionOptions: User[]
}>()
const emit = defineEmits<{ submit: [{ body: string; mentionUserIds: string[] }] }>()

const draft = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const mentionActive = ref(false)
const mentionQuery = ref('')
const pickedMentions = ref(new Map<string, string>()) // 멘션한 이름 -> userId

const mentionCandidates = computed(() => {
  const q = mentionQuery.value.toLowerCase()
  return props.mentionOptions.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6)
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

function submit() {
  const body = draft.value.trim()
  if (!body) return
  const mentionUserIds = [...pickedMentions.value.entries()]
    .filter(([name]) => body.includes(`@${name}`))
    .map(([, id]) => id)
  emit('submit', { body, mentionUserIds })
  draft.value = ''
  pickedMentions.value = new Map()
  mentionActive.value = false
}

function bodyParts(comment: Comment) {
  const names = comment.mentionUserIds.map((id) => props.usersById[id]?.name).filter((n): n is string => !!n)
  if (!names.length) return [{ text: comment.body, mention: false }]
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(@(?:${escaped.join('|')}))`, 'g')
  return comment.body
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, mention: names.some((n) => part === `@${n}`) }))
}
</script>

<template>
  <div>
    <ul v-if="comments.length" class="space-y-4">
      <li v-for="comment in comments" :key="comment.id" class="flex gap-2.5">
        <div
          class="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
          :style="{ background: usersById[comment.authorId]?.avatarGradient }"
        >
          {{ usersById[comment.authorId]?.initials ?? '?' }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline gap-2">
            <span class="text-[13px] font-semibold text-foreground">{{ usersById[comment.authorId]?.name ?? '알 수 없음' }}</span>
            <span class="text-[11px] text-subtle">{{ formatCommentTime(comment.createdAt) }}</span>
          </div>
          <p class="mt-0.5 text-[13px] leading-relaxed break-words text-foreground">
            <template v-for="(part, i) in bodyParts(comment)" :key="i">
              <span v-if="part.mention" class="font-semibold text-primary">{{ part.text }}</span>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
        </div>
      </li>
    </ul>
    <p v-else class="text-[13px] text-subtle">아직 댓글이 없습니다.</p>

    <div class="relative mt-4">
      <div
        v-if="mentionActive"
        class="absolute bottom-full left-0 z-10 mb-1.5 w-56 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-md"
      >
        <button
          v-for="user in mentionCandidates"
          :key="user.id"
          type="button"
          class="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-accent"
          @mousedown.prevent="pickMention(user)"
        >
          <span
            class="grid size-5 place-items-center rounded-full text-[9px] font-semibold text-white"
            :style="{ background: user.avatarGradient }"
          >
            {{ user.initials }}
          </span>
          {{ user.name }}
        </button>
        <p v-if="!mentionCandidates.length" class="px-2.5 py-1.5 text-xs text-subtle">일치하는 멤버가 없습니다.</p>
      </div>

      <div class="flex items-end gap-2">
        <textarea
          ref="textareaRef"
          v-model="draft"
          rows="2"
          placeholder="댓글을 입력하세요. @이름으로 멘션할 수 있습니다."
          class="min-h-16 flex-1 resize-none rounded-[9px] border border-border-strong bg-card px-3 py-2 text-[13px] outline-none focus:border-primary"
          @input="onInput"
          @keydown.enter.exact.prevent="submit"
        />
        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-[9px] bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
          :disabled="!draft.trim()"
          @click="submit"
        >
          <Send class="size-4" :stroke-width="2.2" />
        </button>
      </div>
    </div>
  </div>
</template>
