import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/mock/types'
import { fetchCurrentUser, login as loginRequest } from '@/api/auth'
import { clearTokens, getAccessToken, setTokens } from '@/lib/token'
import { connectStomp, disconnectStomp } from '@/lib/stomp'
import { useNotificationStore } from './notifications'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)

  async function login(email: string, password: string) {
    const { accessToken, refreshToken, user } = await loginRequest(email, password)
    setTokens(accessToken, refreshToken)
    currentUser.value = user
    connectStomp()
    await useNotificationStore().refreshUnreadCount()
  }

  // 새로고침 시 Pinia 상태는 초기화되지만 토큰은 localStorage에 남아있으므로,
  // 저장된 토큰으로 세션을 복원할 수 있는지 시도한다.
  async function restoreSession(): Promise<boolean> {
    if (!getAccessToken()) return false
    try {
      currentUser.value = await fetchCurrentUser()
      connectStomp()
      await useNotificationStore().refreshUnreadCount()
      return true
    } catch {
      clearTokens()
      currentUser.value = null
      return false
    }
  }

  function logout() {
    disconnectStomp()
    clearTokens()
    currentUser.value = null
  }

  return { currentUser, isAuthenticated, login, restoreSession, logout }
})
