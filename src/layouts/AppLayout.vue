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

// 채널 목록·안읽음 배지는 여기서 손대지 않는다 — ContextBar가 프로젝트 안에 있는 동안 그
// 프로젝트의 모든 채널 토픽을 직접 구독해 갱신하므로(더 즉각적이고 "보고 있음" 백엔드 판정에도
// 안 좁힌다), 여기서까지 같은 채널 이벤트에 반응해 또 invalidate하면 한 메시지에 두 번씩
// 재조회가 걸린다. 이 구독은 알림 목록·안읽음 배지 갱신만 담당한다.
onMounted(() => {
  unsubscribeNotifications = subscribeNotifications((notification: AppNotification) => {
    queryClient.setQueryData<AppNotification[]>(['notifications'], (old) =>
      old?.some((n) => n.id === notification.id) ? old : [notification, ...(old ?? [])],
    )
    notificationStore.refreshUnreadCount()
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
