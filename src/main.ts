import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import './style.css'
import App from './App.vue'
import router from './router'

// 기본 staleTime이 0이면 같은 쿼리 키를 쓰는 컴포넌트가 몇 ms 간격으로만 마운트돼도
// (예: ContextBar와 MessengerPage가 동시에 ['channels', projectKey]를 구독) 캐시가 있어도
// "이미 stale"로 판단해 각자 다시 요청한다. 실시간으로 바뀌어야 하는 데이터는 STOMP 이벤트가
// 명시적으로 invalidateQueries를 호출해 갱신하므로, 짧은 staleTime으로 폴링하듯 계속
// 재요청할 필요가 없다 — 30초 정도면 중복 마운트발 재조회는 막고 명시적 invalidate는 그대로 즉시 반영된다.
//
// refetchOnWindowFocus도 같은 이유로 끈다 — 다른 탭 갔다가 돌아올 때마다 마운트된 쿼리 전부가
// (channels/projects/folders/notifications 등 10여 개) 한꺼번에 재조회되는데, notifications·
// unread-count처럼 실시간성이 필요한 건 이미 STOMP 이벤트가 즉시 invalidateQueries로 갱신하고
// 있어서 focus 재조회가 없어도 최신 상태가 깨지지 않는다.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, { queryClient }).mount('#app')
