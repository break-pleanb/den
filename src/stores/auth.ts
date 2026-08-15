import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@/mock/types'
import { fetchCurrentUser } from '@/mock/api'
import { useNotificationStore } from './notifications'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)

  async function login() {
    currentUser.value = await fetchCurrentUser()
    await useNotificationStore().refreshUnreadCount()
  }

  function logout() {
    currentUser.value = null
  }

  return { currentUser, isAuthenticated, login, logout }
})
