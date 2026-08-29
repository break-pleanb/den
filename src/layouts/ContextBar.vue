<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { ChartGantt, ListChecks, MessageSquare, Search, Settings } from '@lucide/vue'
import { fetchChannelsByProjectKey, fetchUnreadChannelCount } from '@/api/messenger'
import { fetchMenuPermissions } from '@/api/permissions'
import { fetchProjectByKey } from '@/api/projects'
import { subscribeChannelMessages } from '@/lib/stomp'
import { useAuthStore } from '@/stores/auth'
import NotificationBell from '@/features/notifications/components/NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()

// 입력창은 로컬 ref로 즉시 반응하고, URL 반영은 디바운스 후 router.push로 커밋한다.
// 매 타이핑마다 push하면 뒤로가기 히스토리가 글자 수만큼 쌓이므로, 입력이 잠시 멈췄을 때만
// 하나의 히스토리 항목으로 기록해 뒤로가기 시 검색 이전 상태로 복원되게 한다 (URL 우선 원칙).
const taskSearchTerm = ref((route.query.q as string) ?? '')

watch(
  () => route.query.q,
  (q) => {
    const value = (q as string) ?? ''
    if (value !== taskSearchTerm.value) taskSearchTerm.value = value
  },
)

const commitSearch = useDebounceFn((value: string) => {
  router.push({ query: { ...route.query, q: value || undefined, page: undefined } })
}, 400)

// v-model은 한글 IME 조합 중 input을 무시해 조합이 끝나기 전까지 검색에 반영되지 않는다.
// input 이벤트에서 target.value를 직접 읽어 조합 중에도 즉시 반영되게 한다.
function onTaskSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  taskSearchTerm.value = value
  commitSearch(value)
}

const projectKey = computed(() => route.params.projectKey as string)

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: menuPermissions } = useQuery({
  queryKey: ['menu-permissions', projectKey],
  queryFn: () => fetchMenuPermissions(projectKey.value),
})

const { data: unreadChannelCount } = useQuery({
  queryKey: ['unread-channels', projectKey],
  queryFn: () => fetchUnreadChannelCount(projectKey.value),
})

// 메신저 배지가 실시간으로 갱신되도록, 메신저 화면에 들어가 있지 않아도 이 프로젝트의 모든 채널을
// 미리 구독해둔다 (MessengerPage는 지금 열려있는 채널만 구독하므로 다른 화면에서는 갱신되지 않았음)
const { data: channels } = useQuery({
  queryKey: ['channels', projectKey],
  queryFn: () => fetchChannelsByProjectKey(projectKey.value),
  enabled: computed(() => !!projectKey.value),
})

const currentUserId = computed(() => authStore.currentUser?.id)
let channelUnsubscribers: (() => void)[] = []

function resubscribeChannels() {
  for (const unsubscribe of channelUnsubscribers) unsubscribe()
  channelUnsubscribers = (channels.value ?? []).map((channel) =>
    subscribeChannelMessages(channel.id, (message) => {
      if (message.authorId === currentUserId.value) return
      queryClient.invalidateQueries({ queryKey: ['channels', projectKey.value] })
      queryClient.invalidateQueries({ queryKey: ['unread-channels', projectKey.value] })
    }),
  )
}

watch(() => channels.value?.map((c) => c.id).join(','), resubscribeChannels, { immediate: true })
onUnmounted(() => {
  for (const unsubscribe of channelUnsubscribers) unsubscribe()
})

const isTasksTab = computed(
  () => (route.name === 'tasks' || route.name === 'task-detail') && route.query.view !== 'gantt',
)
const isGanttTab = computed(
  () => (route.name === 'tasks' || route.name === 'task-detail') && route.query.view === 'gantt',
)
const isMessengerTab = computed(() => route.name === 'messenger')
const isSettingsTab = computed(() => route.name === 'settings-members' || route.name === 'settings-roles')
</script>

<template>
  <div class="flex h-[52px] shrink-0 items-center gap-1 border-b border-border bg-card px-5">
    <div v-if="project" class="mr-3.5 flex items-center gap-2.5 text-[15px] font-bold">
      <span class="size-[9px] shrink-0 rounded-full" :style="{ background: project.color }" />
      {{ project.name }}
    </div>

    <router-link
      v-if="menuPermissions?.tasks !== false"
      :to="{ name: 'tasks', params: { projectKey }, query: { ...route.query, view: 'list' } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isTasksTab }"
    >
      <ListChecks class="size-[15px]" :stroke-width="2" />
      업무
    </router-link>

    <router-link
      v-if="menuPermissions?.gantt !== false"
      :to="{ name: 'tasks', params: { projectKey }, query: { ...route.query, view: 'gantt' } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isGanttTab }"
    >
      <ChartGantt class="size-[15px]" :stroke-width="2" />
      간트차트
    </router-link>

    <router-link
      v-if="menuPermissions?.messenger !== false"
      :to="{ name: 'messenger', params: { projectKey } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isMessengerTab }"
    >
      <MessageSquare class="size-[15px]" :stroke-width="2" />
      메신저
      <span
        v-if="unreadChannelCount"
        class="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10.5px] font-bold text-primary-foreground"
      >
        {{ unreadChannelCount }}
      </span>
    </router-link>

    <router-link
      :to="{ name: 'settings-members', params: { projectKey } }"
      class="inline-flex items-center gap-1.5 rounded-[9px] px-3.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background hover:text-foreground"
      :class="{ '!bg-primary-soft !text-primary font-semibold': isSettingsTab }"
    >
      <Settings class="size-[15px]" :stroke-width="2" />
      설정
    </router-link>

    <div class="ml-auto flex items-center gap-1.5">
      <div class="flex w-[220px] items-center gap-2 rounded-[9px] border border-border-strong bg-background px-2.5 py-[7px] text-subtle">
        <Search class="size-3.5 shrink-0" :stroke-width="2" />
        <input
          :value="taskSearchTerm"
          placeholder="업무 검색..."
          class="w-full border-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
          @input="onTaskSearchInput"
        />
      </div>
      <NotificationBell />
    </div>
  </div>
</template>
