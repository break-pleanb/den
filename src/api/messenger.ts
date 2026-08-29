import { http } from '@/lib/http'
import type { Channel, Message } from '@/mock/types'

export async function fetchChannelsByProjectKey(projectKey: string): Promise<Channel[]> {
  const { data } = await http.get<Channel[]>(`/projects/${projectKey}/channels`)
  return data
}

export async function createChannel(projectKey: string, name: string, memberIds: string[] = []): Promise<Channel> {
  const { data } = await http.post<Channel>(`/projects/${projectKey}/channels`, { name, memberIds })
  return data
}

// 멱등 — 두 사람 사이 DM 채널이 이미 있으면 새로 만들지 않고 그 채널을 그대로 반환한다
export async function createDmChannel(projectKey: string, targetUserId: string): Promise<Channel> {
  const { data } = await http.post<Channel>(`/projects/${projectKey}/channels/dm`, { targetUserId })
  return data
}

export async function fetchUnreadChannelCount(projectKey: string): Promise<number> {
  const { data } = await http.get<number>(`/projects/${projectKey}/channels/unread-count`)
  return data
}

export async function fetchMessagesByChannelId(channelId: string): Promise<Message[]> {
  const { data } = await http.get<Message[]>(`/channels/${channelId}/messages`)
  return data
}

export async function sendMessage(channelId: string, body: string, mentionUserIds: string[]): Promise<Message> {
  const { data } = await http.post<Message>(`/channels/${channelId}/messages`, { body, mentionUserIds })
  return data
}

export async function markChannelRead(channelId: string): Promise<void> {
  await http.post(`/channels/${channelId}/read`)
}
