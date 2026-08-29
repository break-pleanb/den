import { http } from '@/lib/http'
import type { User } from '@/mock/types'

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await http.post<LoginResult>('/auth/login', { email, password })
  return data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await http.get<User>('/auth/me')
  return data
}
