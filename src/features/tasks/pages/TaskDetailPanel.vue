<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { X } from '@lucide/vue'
import { fetchTaskById } from '@/mock/api'
import { PRIORITY_LABEL, STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/constants'

const props = defineProps<{ projectKey: string; taskId: string }>()
const router = useRouter()
const taskId = computed(() => props.taskId)

const { data: task } = useQuery({
  queryKey: ['task', taskId],
  queryFn: () => fetchTaskById(taskId.value),
})

function close() {
  router.push({ name: 'tasks', params: { projectKey: props.projectKey } })
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex justify-end bg-black/20" @click.self="close">
    <div class="h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6 shadow-card">
      <div class="mb-4 flex items-start justify-between gap-3">
        <span class="font-mono text-xs font-semibold text-muted-foreground">{{ task?.code }}</span>
        <button type="button" class="text-muted-foreground hover:text-foreground" @click="close">
          <X class="size-4.5" />
        </button>
      </div>

      <div v-if="task">
        <div class="text-lg font-bold">{{ task.title }}</div>
        <div class="mt-3 flex items-center gap-2">
          <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="STATUS_BADGE_CLASS[task.status]">
            {{ STATUS_LABEL[task.status] }}
          </span>
          <span class="text-xs font-medium text-muted-foreground">{{ PRIORITY_LABEL[task.priority] }}</span>
        </div>
        <div class="mt-4 text-sm text-muted-foreground">
          업무 상세 화면은 다음 단계(4. 업무 상세 패널)에서 완성됩니다.
        </div>
      </div>
    </div>
  </div>
</template>
