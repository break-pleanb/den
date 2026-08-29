import { http } from '@/lib/http'
import type { AppNotification } from '@/mock/types'

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await http.get<AppNotification[]>('/notifications')
  return data
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await http.get<number>('/notifications/unread-count')
  return data
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await http.post(`/notifications/${notificationId}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.post('/notifications/read-all')
}
