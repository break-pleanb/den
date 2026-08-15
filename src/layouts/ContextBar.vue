<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { Bell, ChartGantt, ListChecks, MessageSquare, Search, Settings } from '@lucide/vue'
import {
  fetchMenuPermissions,
  fetchProjectByKey,
  fetchUnreadChannelCount,
} from '@/mock/api'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const taskSearchTerm = computed({
  get: () => (route.query.q as string) ?? '',
  set: (value) => router.replace({ query: { ...route.query, q: value || undefined } }),
})

// v-model은 한글 IME 조합 중 input을 무시해 조합이 끝나기 전까지 검색에 반영되지 않는다.
// input 이벤트에서 target.value를 직접 읽어 조합 중에도 즉시 반영되게 한다.
function onTaskSearchInput(event: Event) {
  taskSearchTerm.value = (event.target as HTMLInputElement).value
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
      <router-link
        :to="{ name: 'notifications' }"
        class="relative grid size-[34px] place-items-center rounded-[9px] text-muted-foreground hover:bg-background hover:text-foreground"
      >
        <Bell class="size-[18px]" :stroke-width="1.9" />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute top-[7px] right-2 size-[7px] rounded-full border-2 border-card bg-priority-urgent"
        />
      </router-link>
    </div>
  </div>
</template>
