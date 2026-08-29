<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Hash, Plus } from '@lucide/vue'
import {
  fetchChannelsByProjectKey,
  fetchMessagesByChannelId,
  markChannelRead,
  sendMessage,
} from '@/api/messenger'
import { fetchProjectByKey } from '@/api/projects'
import { fetchProjectUsers } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { publishTyping, subscribeChannelMessages, subscribeChannelTyping } from '@/lib/stomp'
import type { Channel, Message, User } from '@/mock/types'
import ChatPanel from '@/features/messenger/components/ChatPanel.vue'
import CreateChannelDialog from '@/features/messenger/components/CreateChannelDialog.vue'

const props = defineProps<{ projectKey: string; channelId?: string }>()
const projectKey = computed(() => props.projectKey)

const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.currentUser?.id)

const { data: channels } = useQuery({
  queryKey: ['channels', projectKey],
  queryFn: () => fetchChannelsByProjectKey(projectKey.value),
})

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: users } = useQuery({ queryKey: ['project-users', projectKey], queryFn: () => fetchProjectUsers(projectKey.value) })
const usersById = computed(() => Object.fromEntries((users.value ?? []).map((u) => [u.id, u])))

const activeChannel = computed<Channel | undefined>(
  () => channels.value?.find((c) => c.id === props.channelId) ?? channels.value?.[0],
)
const activeChannelId = computed(() => activeChannel.value?.id)

function otherMember(channel: Channel): User | undefined {
  const otherId = channel.memberIds.find((id) => id !== currentUserId.value)
  return otherId ? usersById.value[otherId] : undefined
}

const { data: messages } = useQuery({
  queryKey: ['messages', activeChannelId],
  queryFn: () => fetchMessagesByChannelId(activeChannelId.value as string),
  enabled: computed(() => !!activeChannelId.value),
})

// 반드시 "이 채널의" memberIds여야 한다 — 백엔드가 POST /channels/{id}/messages에서
// mentionUserIds가 채널 멤버가 아니면 400을 반환한다 (API-SPEC.md 6장). 프로젝트 전체 멤버로
// 넓히면 채널에 없는 사람도 멘션 후보에 뜨고, 그 사람을 멘션한 채로 보내면 400이 난다.
// (참고: 프로젝트 생성 시 자동 만들어지는 "일반" 채널은 생성자만 멤버로 등록되고, 이후
// 초대되는 멤버는 자동 참여하지 않는다 — API-SPEC.md 2장. 그 멤버를 멘션하려면 채널에 먼저
// 추가해야 한다. 후보가 비어 보이는 게 버그가 아니라 이 정책 때문일 수 있다.)
const mentionOptions = computed<User[]>(() =>
  (activeChannel.value?.memberIds ?? [])
    .filter((id) => id !== currentUserId.value)
    .map((id) => usersById.value[id])
    .filter((u): u is User => !!u),
)

// ── 읽음 처리 ────────────────────────────────────────────

function invalidateChannels() {
  queryClient.invalidateQueries({ queryKey: ['channels', projectKey.value] })
  queryClient.invalidateQueries({ queryKey: ['unread-channels', projectKey.value] })
}

const readMutation = useMutation({
  mutationFn: (channelId: string) => markChannelRead(channelId),
  onSuccess: invalidateChannels,
})

// ── 실시간 메시지 · 입력 중 표시 (STOMP) ───────────────────

function appendMessage(channelId: string, message: Message) {
  queryClient.setQueryData<Message[]>(['messages', channelId], (old) => {
    if (!old) return [message]
    if (old.some((m) => m.id === message.id)) return old
    return [...old, message]
  })
}

const typingUser = ref<User | null>(null)
let typingClearTimer: ReturnType<typeof setTimeout> | undefined
let unsubscribeMessages: (() => void) | undefined
let unsubscribeTyping: (() => void) | undefined

// 그 사람이 보낸 메시지가 도착하면 "입력 중" 표시를 즉시 지운다 — 3초 타임아웃을 기다리지 않는다
function clearTypingIfMatches(authorId: string) {
  if (typingUser.value?.id !== authorId) return
  typingUser.value = null
  if (typingClearTimer) {
    clearTimeout(typingClearTimer)
    typingClearTimer = undefined
  }
}

// 채널을 바꿀 때마다: 읽음 처리 + 이전 채널 STOMP 구독 해제 후 새 채널 구독을 한 번에 처리한다
// (activeChannelId 하나에 두 watch를 따로 걸면 선언 순서에 따라 TDZ 참조 오류가 나기 쉽다)
watch(
  activeChannelId,
  (channelId) => {
    typingUser.value = null
    if (typingClearTimer) {
      clearTimeout(typingClearTimer)
      typingClearTimer = undefined
    }
    if (channelId) readMutation.mutate(channelId)

    unsubscribeMessages?.()
    unsubscribeTyping?.()
    unsubscribeMessages = undefined
    unsubscribeTyping = undefined
    if (!channelId) return

    unsubscribeMessages = subscribeChannelMessages(channelId, (message) => {
      appendMessage(channelId, message)
      clearTypingIfMatches(message.authorId)
      // 보고 있는 채널에 다른 사람이 보낸 메시지가 실시간으로 도착 — last_read_at을 갱신해 안읽음 수가 밀리지 않게 한다
      if (message.authorId !== currentUserId.value) readMutation.mutate(channelId)
    })

    unsubscribeTyping = subscribeChannelTyping(channelId, (payload) => {
      if (payload.userId === currentUserId.value) return
      typingUser.value = usersById.value[payload.userId] ?? null
      if (typingClearTimer) clearTimeout(typingClearTimer)
      typingClearTimer = setTimeout(() => {
        typingUser.value = null
      }, 3000)
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  unsubscribeMessages?.()
  unsubscribeTyping?.()
  if (typingClearTimer) clearTimeout(typingClearTimer)
})

let lastTypingPublishAt = 0
function onTyping() {
  const channelId = activeChannelId.value
  if (!channelId) return
  const now = Date.now()
  if (now - lastTypingPublishAt < 2000) return
  lastTypingPublishAt = now
  publishTyping(channelId)
}

// ── 메시지 전송 ────────────────────────────────────────────

const sendMutation = useMutation({
  mutationFn: (payload: { body: string; mentionUserIds: string[] }) =>
    sendMessage(activeChannelId.value as string, payload.body, payload.mentionUserIds),
  onSuccess: (message) => {
    const channelId = activeChannelId.value
    if (!channelId) return
    appendMessage(channelId, message)
    // 내가 방금 보낸 메시지도 last_read_at 이후 메시지로 잡혀 내 안읽음 수가 올라가므로, 보내자마자 읽음 처리한다
    readMutation.mutate(channelId)
  },
})

function onSubmit(payload: { body: string; mentionUserIds: string[] }) {
  sendMutation.mutate(payload)
}

// ── 채널 생성 · DM 시작 ──────────────────────────────────────

const createOpen = ref(false)

function onChannelCreated(channel: Channel) {
  invalidateChannels()
  queryClient.setQueryData<Channel[]>(['channels', projectKey.value], (old) =>
    old?.some((c) => c.id === channel.id) ? old : [...(old ?? []), channel],
  )
  router.push({ name: 'messenger', params: { projectKey: projectKey.value, channelId: channel.id } })
}
</script>

<template>
  <div class="flex h-full gap-4">
    <div class="flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card p-2 shadow-card">
      <button
        type="button"
        class="mb-1.5 flex items-center gap-2 rounded-[9px] border border-dashed border-border-strong px-2.5 py-2 text-[13px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
        @click="createOpen = true"
      >
        <Plus class="size-3.5 shrink-0" :stroke-width="2.2" />
        새 대화
      </button>

      <div class="flex-1 overflow-y-auto">
        <router-link
          v-for="channel in channels"
          :key="channel.id"
          :to="{ name: 'messenger', params: { projectKey, channelId: channel.id } }"
          class="flex items-center gap-2 rounded-[9px] px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-[#f4f5f7] hover:text-foreground"
          :class="{ '!bg-primary-soft !text-primary font-semibold': activeChannel?.id === channel.id }"
        >
          <Hash v-if="channel.type === 'group'" class="size-3.5 shrink-0" :stroke-width="2" />
          <span
            v-else
            class="grid size-4 shrink-0 place-items-center rounded-full text-[7px] font-bold text-white"
            :style="{ background: otherMember(channel)?.avatarGradient }"
          >
            {{ otherMember(channel)?.initials ?? '?' }}
          </span>
          <span class="truncate">{{ channel.name }}</span>
          <span
            v-if="channel.unreadCount > 0"
            class="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-primary-foreground"
          >
            {{ channel.unreadCount }}
          </span>
        </router-link>

        <p v-if="channels && !channels.length" class="px-2.5 py-2 text-[13px] text-subtle">채널이 없습니다.</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-card p-4 shadow-card">
      <template v-if="activeChannel">
        <div class="mb-3 flex shrink-0 items-center gap-2 border-b border-border pb-3">
          <Hash v-if="activeChannel.type === 'group'" class="size-4 shrink-0 text-muted-foreground" :stroke-width="2" />
          <div
            v-else
            class="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
            :style="{ background: otherMember(activeChannel)?.avatarGradient }"
          >
            {{ otherMember(activeChannel)?.initials ?? '?' }}
          </div>
          <div>
            <div class="text-[14px] font-bold text-foreground">
              {{ activeChannel.type === 'group' ? activeChannel.name : otherMember(activeChannel)?.name ?? activeChannel.name }}
            </div>
            <div v-if="activeChannel.type === 'group'" class="text-[11px] text-subtle">멤버 {{ activeChannel.memberIds.length }}명</div>
            <div v-else class="text-[11px] text-subtle">{{ otherMember(activeChannel)?.title ?? '1:1 대화' }}</div>
          </div>
          <div v-if="project" class="ml-auto text-[11px] text-subtle">{{ project.name }}</div>
        </div>

        <ChatPanel
          :messages="messages ?? []"
          :users-by-id="usersById"
          :mention-options="mentionOptions"
          :typing-user="typingUser"
          @submit="onSubmit"
          @typing="onTyping"
        />
      </template>

      <div v-else class="grid flex-1 place-items-center text-[13px] text-subtle">채널을 선택해주세요.</div>
    </div>

    <CreateChannelDialog
      v-model:open="createOpen"
      :project-key="projectKey"
      :users="users ?? []"
      :current-user-id="currentUserId"
      @created="onChannelCreated"
    />
  </div>
</template>
