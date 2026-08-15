<script setup lang="ts">
import { ref } from 'vue'
import type { LocationQueryRaw } from 'vue-router'
import { Check, Plus } from '@lucide/vue'
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/constants'
import type { Task } from '@/mock/types'

defineProps<{ projectKey: string; subtasks: Task[]; query: LocationQueryRaw }>()
const emit = defineEmits<{ 'toggle-done': [Task]; add: [string] }>()

const draft = ref('')

function submit() {
  const title = draft.value.trim()
  if (!title) return
  emit('add', title)
  draft.value = ''
}
</script>

<template>
  <div>
    <ul v-if="subtasks.length" class="divide-y divide-border overflow-hidden rounded-lg border border-border">
      <li v-for="sub in subtasks" :key="sub.id" class="flex items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          class="grid size-[17px] shrink-0 place-items-center rounded-[6px] border-[1.8px] border-border-strong bg-card"
          :class="sub.status === 'done' ? '!border-status-done-fg !bg-status-done-fg' : ''"
          :aria-label="sub.status === 'done' ? '완료 해제' : '완료로 표시'"
          @click="emit('toggle-done', sub)"
        >
          <Check v-if="sub.status === 'done'" class="size-[10px] text-white" :stroke-width="3" />
        </button>
        <router-link
          :to="{ name: 'task-detail', params: { projectKey, taskId: sub.id }, query }"
          class="min-w-0 flex-1 truncate text-[13px] font-medium hover:text-primary"
          :class="sub.status === 'done' ? 'text-subtle line-through' : 'text-foreground'"
        >
          {{ sub.title }}
        </router-link>
        <span class="shrink-0 rounded-full px-2 py-px text-[11px] font-semibold" :class="STATUS_BADGE_CLASS[sub.status]">
          {{ STATUS_LABEL[sub.status] }}
        </span>
      </li>
    </ul>
    <p v-else class="text-[13px] text-subtle">하위 업무가 없습니다.</p>

    <form class="mt-2 flex items-center gap-1.5" @submit.prevent="submit">
      <input
        v-model="draft"
        type="text"
        placeholder="하위 업무 추가"
        class="h-8 min-w-0 flex-1 rounded-[9px] border border-border-strong bg-card px-2.5 text-[13px] outline-none focus:border-primary"
      >
      <button
        type="submit"
        class="grid size-8 shrink-0 place-items-center rounded-[9px] border border-border-strong text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
        :disabled="!draft.trim()"
      >
        <Plus class="size-3.5" :stroke-width="2.4" />
      </button>
    </form>
  </div>
</template>
