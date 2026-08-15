<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { fetchProjectByKey, fetchTasksByProjectKey } from '@/mock/api'
import { STATUS_LABEL, STATUS_ORDER } from '@/lib/constants'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)
const route = useRoute()

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: tasks } = useQuery({
  queryKey: ['tasks', projectKey],
  queryFn: () => fetchTasksByProjectKey(projectKey.value),
})

const countByStatus = computed(() => {
  const counts = { todo: 0, progress: 0, review: 0, done: 0 }
  for (const task of tasks.value ?? []) counts[task.status]++
  return counts
})

const searchTerm = computed(() => ((route.query.q as string) ?? '').trim().toLowerCase())

const filteredTasks = computed(() => {
  const all = tasks.value ?? []
  const term = searchTerm.value
  if (!term) return all
  return all.filter((t) => t.title.toLowerCase().includes(term) || t.code.toLowerCase().includes(term))
})
</script>

<template>
  <div class="relative">
    <div class="mb-4">
      <div class="text-xl font-bold tracking-tight">업무 목록</div>
      <div class="mt-0.5 text-sm text-muted-foreground">
        {{ project?.name }} · 전체 {{ tasks?.length ?? 0 }}개 업무
      </div>
    </div>

    <div class="flex gap-2">
      <div
        v-for="status in STATUS_ORDER"
        :key="status"
        class="rounded-lg border border-border bg-card px-3.5 py-2.5"
      >
        <div class="text-xs text-muted-foreground">{{ STATUS_LABEL[status] }}</div>
        <div class="mt-0.5 text-lg font-bold">{{ countByStatus[status] }}</div>
      </div>
    </div>

    <div v-if="!filteredTasks.length" class="mt-4 rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
      "{{ searchTerm }}"에 해당하는 업무가 없습니다.
    </div>
    <div v-else class="mt-4 rounded-lg border border-border bg-card shadow-card">
      <router-link
        v-for="task in filteredTasks"
        :key="task.id"
        :to="{ name: 'task-detail', params: { projectKey, taskId: task.id }, query: route.query }"
        class="flex items-center gap-3 border-b border-border px-4 py-3 last:border-none hover:bg-[#fafbfc]"
      >
        <span class="font-mono text-xs font-semibold text-muted-foreground">{{ task.code }}</span>
        <span class="truncate text-sm font-medium">{{ task.title }}</span>
      </router-link>
    </div>

    <router-view />
  </div>
</template>
