import type { Channel } from './types'

export const mockChannels: Channel[] = [
  { id: 'c-app-general', projectId: 'p-app', name: '일반', type: 'group', memberIds: ['u-jk', 'u-sy', 'u-km', 'u-hr'], unreadCount: 3 },
  { id: 'c-app-design', projectId: 'p-app', name: '디자인', type: 'group', memberIds: ['u-jk', 'u-sy'], unreadCount: 0 },
  { id: 'c-app-bugs', projectId: 'p-app', name: '버그리포트', type: 'group', memberIds: ['u-jk', 'u-km', 'u-hr'], unreadCount: 0 },

  { id: 'c-backend-general', projectId: 'p-backend', name: '일반', type: 'group', memberIds: ['u-jk', 'u-sa'], unreadCount: 0 },

  { id: 'c-simsec-general', projectId: 'p-sim-sec', name: '일반', type: 'group', memberIds: ['u-jk', 'u-jy'], unreadCount: 1 },
]

export function getChannelsByProject(projectId: string): Channel[] {
  return mockChannels.filter((c) => c.projectId === projectId)
}

export function getUnreadChannelCount(projectId: string): number {
  return getChannelsByProject(projectId).reduce((sum, c) => sum + c.unreadCount, 0)
}
