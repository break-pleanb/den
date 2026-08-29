<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { subscribeNotifications } from '@/lib/stomp'
import { useNotificationStore } from '@/stores/notifications'
import type { AppNotification } from '@/mock/types'
import Sidebar from './Sidebar.vue'
import ContextBar from './ContextBar.vue'

const route = useRoute()
const queryClient = useQueryClient()
const notificationStore = useNotificationStore()

// 로그인된 세션 전체에서 한 번만 구독 — 개인 알림 큐로 오는 실시간 알림을 목록·안읽음 배지에 즉시 반영한다
let unsubscribeNotifications: (() => void) | undefined

onMounted(() => {
  unsubscribeNotifications = subscribeNotifications((notification: AppNotification) => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (old) =>
      old?.some((n) => n.id === notification.id) ? old : [notification, ...(old ?? [])],
    )
    notificationStore.refreshUnreadCount()
    if (notification.type === 'channel_message' && notification.projectKey) {
      queryClient.invalidateQueries({ queryKey: ['channels', notification.projectKey] })
      queryClient.invalidateQueries({ queryKey: ['unread-channels', notification.projectKey] })
    }
  })
})

onUnmounted(() => unsubscribeNotifications?.())
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-[14px] text-foreground">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <ContextBar v-if="route.params.projectKey" />
      <div class="flex-1 overflow-y-auto p-[22px]">
        <router-view />
      </div>
    </div>
  </div>
</template>
