<script setup lang="ts">
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchNotifications } from '@/mock/api'
import { useNotificationStore } from '@/stores/notifications'
import { Button } from '@/components/ui/button'

const queryClient = useQueryClient()
const notificationStore = useNotificationStore()

const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications })

async function onMarkRead(id: string) {
  await notificationStore.markAsRead(id)
  await queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

async function onMarkAllRead() {
  await notificationStore.markAllAsRead()
  await queryClient.invalidateQueries({ queryKey: ['notifications'] })
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-start justify-between gap-3">
      <div>
        <div class="text-xl font-bold tracking-tight">알림</div>
        <div class="mt-0.5 text-sm text-muted-foreground">안읽음 {{ notificationStore.unreadCount }}개</div>
      </div>
      <Button variant="outline" size="sm" @click="onMarkAllRead">모두 읽음</Button>
    </div>

    <div class="rounded-lg border border-border bg-card shadow-card">
      <button
        v-for="n in notifications"
        :key="n.id"
        type="button"
        class="flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-none hover:bg-[#fafbfc]"
        :class="{ 'bg-primary-soft/40': !n.isRead }"
        @click="onMarkRead(n.id)"
      >
        <span
          class="mt-1.5 size-1.5 shrink-0 rounded-full"
          :class="n.isRead ? 'bg-transparent' : 'bg-primary'"
        />
        <div class="min-w-0">
          <div class="text-sm font-semibold">{{ n.title }}</div>
          <div class="mt-0.5 truncate text-xs text-muted-foreground">{{ n.body }}</div>
        </div>
      </button>
    </div>
  </div>
</template>
