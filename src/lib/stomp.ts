import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { getAccessToken } from './token'
import type { AppNotification, Message } from '@/mock/types'

// 브라우저 네이티브 WebSocket은 핸드셰이크에 커스텀 헤더를 못 실으므로 토큰을 쿼리로 전달한다.
// webSocketFactory로 감싸 (재)연결 시도마다 최신 토큰을 다시 읽는다 (리프레시로 갱신된 토큰 반영).
function socketUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const token = getAccessToken() ?? ''
  return `${protocol}://${location.host}/ws?token=${encodeURIComponent(token)}`
}

interface Registration {
  destination: string
  onBody: (body: string) => void
  sub: StompSubscription | null
}

let client: Client | null = null
const registrations = new Set<Registration>()

function subscribeAll() {
  if (!client?.connected) return
  for (const reg of registrations) {
    reg.sub = client.subscribe(reg.destination, (message: IMessage) => reg.onBody(message.body))
  }
}

export function connectStomp() {
  if (client) return
  client = new Client({
    webSocketFactory: () => new WebSocket(socketUrl()),
    reconnectDelay: 3000,
    onConnect: subscribeAll,
  })
  client.activate()
}

export function disconnectStomp() {
  client?.deactivate()
  client = null
  for (const reg of registrations) reg.sub = null
  registrations.clear()
}

// destination 구독 — 재연결 시마다 subscribeAll이 자동으로 다시 구독해준다
function subscribeTopic<T>(destination: string, onMessage: (payload: T) => void): () => void {
  connectStomp()
  const reg: Registration = { destination, onBody: (body) => onMessage(JSON.parse(body) as T), sub: null }
  registrations.add(reg)
  if (client?.connected) reg.sub = client.subscribe(destination, (message: IMessage) => reg.onBody(message.body))

  return () => {
    reg.sub?.unsubscribe()
    registrations.delete(reg)
  }
}

function publish(destination: string, body: unknown) {
  if (!client?.connected) return
  client.publish({ destination, body: JSON.stringify(body) })
}

export function subscribeChannelMessages(channelId: string, onMessage: (message: Message) => void): () => void {
  return subscribeTopic<Message>(`/topic/channel/${channelId}`, onMessage)
}

export interface TypingPayload {
  userId: string
  at: string
}

export function subscribeChannelTyping(channelId: string, onTyping: (payload: TypingPayload) => void): () => void {
  return subscribeTopic<TypingPayload>(`/topic/channel/${channelId}/typing`, onTyping)
}

export function publishTyping(channelId: string) {
  publish(`/app/channel/${channelId}/typing`, {})
}

export function subscribeNotifications(onNotification: (notification: AppNotification) => void): () => void {
  return subscribeTopic<AppNotification>('/user/queue/notifications', onNotification)
}
