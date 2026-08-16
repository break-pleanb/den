<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { Send } from '@lucide/vue'
import { formatDayDivider, formatMessageTime } from '@/lib/date'
import { splitMentionText, useMentionInput } from '@/lib/mentions'
import type { Message, User } from '@/mock/types'

const props = defineProps<{
  messages: Message[]
  usersById: Record<string, User>
  mentionOptions: User[]
  typingUser?: User | null
}>()
const emit = defineEmits<{ submit: [{ body: string; mentionUserIds: string[] }] }>()

const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')
const { draft, mentionActive, mentionCandidates, onInput, pickMention, consumeMentionIds, reset } = useMentionInput(
  () => props.mentionOptions,
  textareaRef,
)

const scrollRef = useTemplateRef<HTMLDivElement>('scrollRef')

function scrollToBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(
  () => [props.messages, props.typingUser],
  () => scrollToBottom(),
  { deep: true, immediate: true },
)

function submit() {
  const body = draft.value.trim()
  if (!body) return
  emit('submit', { body, mentionUserIds: consumeMentionIds(body) })
  reset()
}

// 5분 이내 · 같은 작성자의 연속 메시지는 아바타·이름을 생략해 묶어 보여준다
const FIVE_MIN = 5 * 60 * 1000
const displayItems = computed(() => {
  const items: { message: Message; showHeader: boolean; dayLabel?: string }[] = []
  let prev: Message | undefined
  for (const message of props.messages) {
    const dayLabel = formatDayDivider(message.createdAt)
    const prevDayLabel = prev ? formatDayDivider(prev.createdAt) : undefined
    const sameGroup =
      !!prev &&
      prev.authorId === message.authorId &&
      dayLabel === prevDayLabel &&
      new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < FIVE_MIN
    items.push({ message, showHeader: !sameGroup, dayLabel: dayLabel !== prevDayLabel ? dayLabel : undefined })
    prev = message
  }
  return items
})

function bodyParts(message: Message) {
  return splitMentionText(message.body, message.mentionUserIds, props.usersById)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div ref="scrollRef" class="flex-1 overflow-y-auto px-1">
      <p v-if="!messages.length" class="py-10 text-center text-[13px] text-subtle">
        아직 메시지가 없습니다. 첫 메시지를 보내보세요.
      </p>

      <template v-for="item in displayItems" :key="item.message.id">
        <div v-if="item.dayLabel" class="my-3 flex items-center gap-3 text-[11px] font-medium text-subtle">
          <span class="h-px flex-1 bg-border" />
          {{ item.dayLabel }}
          <span class="h-px flex-1 bg-border" />
        </div>
        <div class="flex gap-2.5 rounded-md px-1.5 py-0.5 hover:bg-[#f7f8fa]" :class="item.showHeader && 'mt-2'">
          <div class="w-7 shrink-0">
            <div
              v-if="item.showHeader"
              class="grid size-7 place-items-center rounded-full text-[10px] font-semibold text-white"
              :style="{ background: usersById[item.message.authorId]?.avatarGradient }"
            >
              {{ usersById[item.message.authorId]?.initials ?? '?' }}
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div v-if="item.showHeader" class="flex items-baseline gap-2">
              <span class="text-[13px] font-semibold text-foreground">{{ usersById[item.message.authorId]?.name ?? '알 수 없음' }}</span>
              <span class="text-[11px] text-subtle">{{ formatMessageTime(item.message.createdAt) }}</span>
            </div>
            <p class="text-[13px] leading-relaxed break-words text-foreground">
              <template v-for="(part, i) in bodyParts(item.message)" :key="i">
                <span v-if="part.mention" class="font-semibold text-primary">{{ part.text }}</span>
                <template v-else>{{ part.text }}</template>
              </template>
            </p>
          </div>
        </div>
      </template>

      <div v-if="typingUser" class="mt-1 flex items-center gap-2 px-1.5 py-1.5 text-[12px] text-subtle">
        <span
          class="grid size-5 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white"
          :style="{ background: typingUser.avatarGradient }"
        >
          {{ typingUser.initials }}
        </span>
        {{ typingUser.name }}님이 입력 중
        <span class="inline-flex gap-0.5">
          <span class="size-1 animate-bounce rounded-full bg-subtle" style="animation-delay: 0ms" />
          <span class="size-1 animate-bounce rounded-full bg-subtle" style="animation-delay: 150ms" />
          <span class="size-1 animate-bounce rounded-full bg-subtle" style="animation-delay: 300ms" />
        </span>
      </div>
    </div>

    <div class="relative mt-3 shrink-0">
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

      <div
        class="flex items-end gap-2 rounded-[9px] border border-border-strong bg-card px-2 py-1.5 focus-within:border-primary"
      >
        <textarea
          ref="textareaRef"
          v-model="draft"
          rows="1"
          placeholder="메시지를 입력하세요. @이름으로 멘션할 수 있습니다."
          class="max-h-32 min-h-9 flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-[13px] outline-none placeholder:text-subtle"
          @input="onInput"
          @keydown.enter.exact.prevent="submit"
        />
        <button
          type="button"
          class="grid size-8 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
          :disabled="!draft.trim()"
          @click="submit"
        >
          <Send class="size-4" :stroke-width="2.2" />
        </button>
      </div>
    </div>
  </div>
</template>
