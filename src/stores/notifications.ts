import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'

export const useNotificationStore = defineStore('notifications', () => {
  const unreadCount = ref(0)

  async function refreshUnreadCount() {
    unreadCount.value = await fetchUnreadNotificationCount()
  }

  async function markAsRead(notificationId: string) {
    await markNotificationRead(notificationId)
    await refreshUnreadCount()
  }

  async function markAllAsRead() {
    await markAllNotificationsRead()
    await refreshUnreadCount()
  }

  return { unreadCount, refreshUnreadCount, markAsRead, markAllAsRead }
})
