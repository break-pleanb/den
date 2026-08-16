<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCheck } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/date'
import { useNotifications } from '../composables/useNotifications'
import {
  NOTIFICATION_TYPE_ICON,
  NOTIFICATION_TYPE_LABEL,
  NOTIFICATION_TYPE_ORDER,
  notificationRoute,
} from '../lib/notificationDisplay'
import type { AppNotification, NotificationType } from '@/mock/types'

const route = useRoute()
const router = useRouter()
const { notifications, markAsRead, markAllAsRead } = useNotifications()

const sortedNotifications = computed(() =>
  [...(notifications.value ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

// 실제 목업 데이터에 존재하는 유형만 필터 칩으로 노출 — 항상 7종을 다 보여줄 필요는 없다
const availableTypes = computed(() =>
  NOTIFICATION_TYPE_ORDER.filter((type) => sortedNotifications.value.some((n) => n.type === type)),
)

const activeType = computed<NotificationType | undefined>(() => {
  const value = route.query.type as string | undefined
  return value && NOTIFICATION_TYPE_ORDER.includes(value as NotificationType) ? (value as NotificationType) : undefined
})

function setActiveType(type: NotificationType | undefined) {
  router.push({ query: { ...route.query, type } })
}

const filteredNotifications = computed(() => {
  if (!activeType.value) return sortedNotifications.value
  return sortedNotifications.value.filter((n) => n.type === activeType.value)
})

const unreadCount = computed(() => sortedNotifications.value.filter((n) => !n.isRead).length)

async function onSelect(notification: AppNotification) {
  if (!notification.isRead) await markAsRead(notification.id)
  const to = notificationRoute(notification)
  if (to) router.push(to)
}
</script>

<template>
  <div>
    <div class="mb-5 flex items-start justify-between gap-3">
      <div>
        <div class="text-xl font-bold tracking-tight">알림</div>
        <div class="mt-0.5 text-sm text-muted-foreground">안읽음 {{ unreadCount }}개</div>
      </div>
      <Button variant="outline" size="sm" :disabled="unreadCount === 0" @click="markAllAsRead">
        <CheckCheck class="size-3.5" :stroke-width="2" />
        모두 읽음
      </Button>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        class="rounded-full border px-3 py-1.5 text-[12.5px] font-medium"
        :class="
          !activeType
            ? 'border-primary bg-primary text-primary-foreground font-semibold'
            : 'border-border-strong bg-card text-muted-foreground hover:bg-background'
        "
        @click="setActiveType(undefined)"
      >
        전체
      </button>
      <button
        v-for="type in availableTypes"
        :key="type"
        type="button"
        class="rounded-full border px-3 py-1.5 text-[12.5px] font-medium"
        :class="
          activeType === type
            ? 'border-primary bg-primary text-primary-foreground font-semibold'
            : 'border-border-strong bg-card text-muted-foreground hover:bg-background'
        "
        @click="setActiveType(type)"
      >
        {{ NOTIFICATION_TYPE_LABEL[type] }}
      </button>
    </div>

    <div class="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <p v-if="!filteredNotifications.length" class="px-4 py-16 text-center text-sm text-muted-foreground">
        {{ activeType ? `${NOTIFICATION_TYPE_LABEL[activeType]} 알림이 없습니다.` : '알림이 없습니다.' }}
      </p>
      <button
        v-for="n in filteredNotifications"
        :key="n.id"
        type="button"
        class="flex w-full items-start gap-3 border-b border-border px-4 py-3.5 text-left last:border-none hover:bg-[#fafbfc]"
        :class="{ 'bg-primary-soft/40': !n.isRead }"
        @click="onSelect(n)"
      >
        <span class="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <component :is="NOTIFICATION_TYPE_ICON[n.type]" class="size-4" :stroke-width="2" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-foreground">{{ n.title }}</span>
            <span v-if="n.projectKey" class="shrink-0 text-[11px] font-medium text-subtle">{{ n.projectKey }}</span>
          </div>
          <div class="mt-0.5 truncate text-xs text-muted-foreground">{{ n.body }}</div>
          <div class="mt-1 text-[11px] text-subtle">{{ formatRelativeTime(n.createdAt) }}</div>
        </div>
        <span
          class="mt-2 size-1.5 shrink-0 rounded-full"
          :class="n.isRead ? 'bg-transparent' : 'bg-primary'"
        />
      </button>
    </div>
  </div>
</template>
