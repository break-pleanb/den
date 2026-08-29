import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchNotifications } from '@/api/notifications'
import { useNotificationStore } from '@/stores/notifications'

// 벨 드롭다운·알림 전체 페이지가 공유하는 조회/읽음 처리 로직.
// 같은 ['notifications'] 쿼리 키를 쓰므로 한쪽에서 읽음 처리하면 다른 쪽도 즉시 갱신된다.
export function useNotifications() {
  const queryClient = useQueryClient()
  const notificationStore = useNotificationStore()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  async function markAsRead(id: string) {
    await notificationStore.markAsRead(id)
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  async function markAllAsRead() {
    await notificationStore.markAllAsRead()
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  return { notifications, isLoading, markAsRead, markAllAsRead }
}
