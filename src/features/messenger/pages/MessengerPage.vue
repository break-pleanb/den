<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Hash } from '@lucide/vue'
import {
  addAutoReply,
  fetchChannelsByProjectKey,
  fetchMessagesByChannelId,
  fetchProjectByKey,
  fetchUsers,
  markChannelRead,
  sendMessage,
  simulateBackgroundActivity,
} from '@/mock/api'
import { CURRENT_USER_ID } from '@/mock/users'
import type { Channel, User } from '@/mock/types'
import ChatPanel from '@/features/messenger/components/ChatPanel.vue'

const props = defineProps<{ projectKey: string; channelId?: string }>()
const projectKey = computed(() => props.projectKey)

const queryClient = useQueryClient()

const { data: channels } = useQuery({
  queryKey: ['channels', projectKey],
  queryFn: () => fetchChannelsByProjectKey(projectKey.value),
})

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
const usersById = computed(() => Object.fromEntries((users.value ?? []).map((u) => [u.id, u])))

const activeChannel = computed<Channel | undefined>(
  () => channels.value?.find((c) => c.id === props.channelId) ?? channels.value?.[0],
)
const activeChannelId = computed(() => activeChannel.value?.id)

function otherMember(channel: Channel): User | undefined {
  const otherId = channel.memberIds.find((id) => id !== CURRENT_USER_ID)
  return otherId ? usersById.value[otherId] : undefined
}

const { data: messages } = useQuery({
  queryKey: ['messages', activeChannelId],
  queryFn: () => fetchMessagesByChannelId(activeChannelId.value as string),
  enabled: computed(() => !!activeChannelId.value),
})

const mentionOptions = computed<User[]>(() =>
  (activeChannel.value?.memberIds ?? [])
    .filter((id) => id !== CURRENT_USER_ID)
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

// ── 메시지 전송 + 실시간 시뮬레이션 ───────────────────────

const typingUser = ref<User | null>(null)
const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

watch(
  activeChannelId,
  (id) => {
    typingUser.value = null
    if (id) readMutation.mutate(id)
  },
  { immediate: true },
)

function after(delay: number, fn: () => void) {
  const timer = setTimeout(() => {
    pendingTimers.delete(timer)
    fn()
  }, delay)
  pendingTimers.add(timer)
}

// 메시지를 보내면 잠시 뒤 채널의 다른 멤버가 "입력 중"이었다가 짧은 답장을 보내는 것처럼 흉내낸다
function scheduleAutoReply(channelId: string) {
  const channel = channels.value?.find((c) => c.id === channelId)
  if (!channel) return
  const others = channel.memberIds.filter((id) => id !== CURRENT_USER_ID)
  if (!others.length) return
  const replierId = others[Math.floor(Math.random() * others.length)]
  const replier = usersById.value[replierId]

  const typingDelay = 600 + Math.random() * 500
  const replyDelay = typingDelay + 1000 + Math.random() * 1400

  after(typingDelay, () => {
    if (activeChannelId.value === channelId) typingUser.value = replier ?? null
  })
  after(replyDelay, async () => {
    if (activeChannelId.value === channelId) typingUser.value = null
    await addAutoReply(channelId, replierId)
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
  })
}

const sendMutation = useMutation({
  mutationFn: (payload: { body: string; mentionUserIds: string[] }) =>
    sendMessage(activeChannelId.value as string, payload.body, payload.mentionUserIds),
  onSuccess: () => {
    const channelId = activeChannelId.value
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    if (channelId) scheduleAutoReply(channelId)
  },
})

function onSubmit(payload: { body: string; mentionUserIds: string[] }) {
  sendMutation.mutate(payload)
}

// 지금 보고 있지 않은 다른 채널에도 이따금 메시지가 도착하는 것처럼 흉내내
// 채널 목록·상단 바의 안읽음 배지가 실시간으로 변하는 것처럼 보여준다
let activityTimer: ReturnType<typeof setTimeout> | undefined

function scheduleBackgroundActivity() {
  const delay = 14000 + Math.random() * 12000
  activityTimer = setTimeout(async () => {
    await simulateBackgroundActivity(projectKey.value, activeChannelId.value)
    invalidateChannels()
    scheduleBackgroundActivity()
  }, delay)
}

onMounted(scheduleBackgroundActivity)
onUnmounted(() => {
  if (activityTimer) clearTimeout(activityTimer)
  for (const timer of pendingTimers) clearTimeout(timer)
})
</script>

<template>
  <div class="flex h-full gap-4">
    <div class="w-56 shrink-0 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-card">
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
        />
      </template>

      <div v-else class="grid flex-1 place-items-center text-[13px] text-subtle">채널을 선택해주세요.</div>
    </div>
  </div>
</template>
