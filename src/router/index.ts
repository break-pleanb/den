import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/pages/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'projects-home',
          component: () => import('@/features/projects/pages/ProjectsHomePage.vue'),
        },
        {
          path: 'notifications',
          name: 'notifications',
          component: () => import('@/features/notifications/pages/NotificationsPage.vue'),
        },
        {
          path: 'p/:projectKey/tasks',
          name: 'tasks',
          component: () => import('@/features/tasks/pages/TaskListPage.vue'),
          props: true,
          children: [
            {
              path: ':taskId',
              name: 'task-detail',
              component: () => import('@/features/tasks/pages/TaskDetailPanel.vue'),
              props: true,
            },
          ],
        },
        {
          path: 'p/:projectKey/messenger/:channelId?',
          name: 'messenger',
          component: () => import('@/features/messenger/pages/MessengerPage.vue'),
          props: true,
        },
        {
          path: 'p/:projectKey/settings/members',
          name: 'settings-members',
          component: () => import('@/features/permissions/pages/MembersSettingsPage.vue'),
          props: true,
        },
        {
          path: 'p/:projectKey/settings/roles',
          name: 'settings-roles',
          component: () => import('@/features/permissions/pages/RolesSettingsPage.vue'),
          props: true,
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

let restoreAttempted = false

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  const auth = useAuthStore()
  if (!auth.isAuthenticated && !restoreAttempted) {
    restoreAttempted = true
    await auth.restoreSession()
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
