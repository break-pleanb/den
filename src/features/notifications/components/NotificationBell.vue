<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, CheckCheck } from '@lucide/vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatRelativeTime } from '@/lib/date'
import { useNotifications } from '../composables/useNotifications'
import { NOTIFICATION_TYPE_ICON, notificationRoute } from '../lib/notificationDisplay'
import type { AppNotification } from '@/mock/types'

const router = useRouter()
const open = ref(false)
const { notifications, markAsRead, markAllAsRead } = useNotifications()

const sortedNotifications = computed(() =>
  [...(notifications.value ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)
const recentNotifications = computed(() => sortedNotifications.value.slice(0, 8))
const unreadCount = computed(() => sortedNotifications.value.filter((n) => !n.isRead).length)
const badgeLabel = computed(() => (unreadCount.value > 9 ? '9+' : String(unreadCount.value)))

async function onSelect(notification: AppNotification) {
  if (!notification.isRead) await markAsRead(notification.id)
  open.value = false
  const to = notificationRoute(notification)
  if (to) router.push(to)
}

async function onMarkAllRead() {
  await markAllAsRead()
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        class="relative grid size-[34px] shrink-0 place-items-center rounded-[9px] text-muted-foreground hover:bg-background hover:text-foreground data-[state=open]:bg-background data-[state=open]:text-foreground"
        aria-label="알림"
      >
        <Bell class="size-[18px]" :stroke-width="1.9" />
        <span
          v-if="unreadCount > 0"
          class="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-card bg-priority-urgent px-0.5 text-[9.5px] font-bold text-white"
        >
          {{ badgeLabel }}
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[360px] p-0" :side-offset="8">
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <div class="text-[13.5px] font-bold">알림</div>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary disabled:cursor-default disabled:opacity-50"
          :disabled="unreadCount === 0"
          @click="onMarkAllRead"
        >
          <CheckCheck class="size-3.5" :stroke-width="2" />
          모두 읽음
        </button>
      </div>

      <div class="max-h-[360px] overflow-y-auto">
        <p v-if="!recentNotifications.length" class="px-4 py-10 text-center text-[13px] text-subtle">
          알림이 없습니다.
        </p>
        <button
          v-for="n in recentNotifications"
          :key="n.id"
          type="button"
          class="flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left last:border-none hover:bg-[#fafbfc]"
          :class="{ 'bg-primary-soft/40': !n.isRead }"
          @click="onSelect(n)"
        >
          <span class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <component :is="NOTIFICATION_TYPE_ICON[n.type]" class="size-3.5" :stroke-width="2" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold text-foreground">{{ n.title }}</div>
            <div class="mt-0.5 truncate text-xs text-muted-foreground">{{ n.body }}</div>
            <div class="mt-1 text-[11px] text-subtle">{{ formatRelativeTime(n.createdAt) }}</div>
          </div>
          <span v-if="!n.isRead" class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
        </button>
      </div>

      <router-link
        :to="{ name: 'notifications' }"
        class="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-primary hover:bg-primary-soft/40"
        @click="open = false"
      >
        전체 알림 보기
      </router-link>
    </PopoverContent>
  </Popover>
</template>
