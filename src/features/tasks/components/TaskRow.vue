<script setup lang="ts">
import { computed } from 'vue'
import type { LocationQueryRaw } from 'vue-router'
import { Check, ChevronDown, Equal, MessageSquare, TriangleAlert, ChevronUp } from '@lucide/vue'
import { formatDueLabel } from '@/lib/date'
import { PRIORITY_LABEL, PRIORITY_TEXT_CLASS, STATUS_BADGE_CLASS, STATUS_DOT_CLASS, STATUS_LABEL } from '@/lib/constants'
import type { Tag, Task, TaskPriority, User } from '@/mock/types'

const props = defineProps<{
  projectKey: string
  task: Task
  assignees: User[]
  tag?: Tag
  query: LocationQueryRaw
}>()

defineEmits<{ 'toggle-done': [] }>()

const PRIORITY_ICON = {
  urgent: TriangleAlert,
  high: ChevronUp,
  medium: Equal,
  low: ChevronDown,
} as const satisfies Record<TaskPriority, unknown>

const due = computed(() => formatDueLabel(props.task.endDate, props.task.status === 'done'))
</script>

<template>
  <router-link
    :to="{ name: 'task-detail', params: { projectKey, taskId: task.id }, query }"
    class="grid grid-cols-[26px_minmax(220px,2.4fr)_108px_96px_140px_120px_80px] items-center gap-3 border-b border-border px-[18px] py-3 last:border-none hover:bg-[#fafbfc]"
  >
    <button
      type="button"
      class="grid size-[18px] shrink-0 place-items-center rounded-[6px] border-[1.8px] border-border-strong bg-card"
      :class="task.status === 'done' ? '!border-status-done-fg !bg-status-done-fg' : ''"
      :aria-label="task.status === 'done' ? '완료 해제' : '완료로 표시'"
      @click.stop.prevent="$emit('toggle-done')"
    >
      <Check v-if="task.status === 'done'" class="size-[11px] text-white" :stroke-width="3" />
    </button>

    <div class="min-w-0">
      <div
        class="truncate text-sm font-semibold tracking-tight"
        :class="task.status === 'done' ? 'text-subtle line-through' : 'text-foreground'"
      >
        {{ task.title }}
      </div>
      <div class="mt-1 flex items-center gap-2.5 text-xs text-subtle">
        <span class="font-semibold text-muted-foreground">{{ task.code }}</span>
        <span v-if="tag" class="rounded-full bg-[#f1f2f5] px-2 py-px text-[11px] font-medium text-muted-foreground">
          {{ tag.name }}
        </span>
        <span v-if="task.commentCount > 0" class="inline-flex items-center gap-1">
          <MessageSquare class="size-3" :stroke-width="2" />
          {{ task.commentCount }}
        </span>
      </div>
    </div>

    <div>
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-xs font-semibold whitespace-nowrap"
        :class="STATUS_BADGE_CLASS[task.status]"
      >
        <span class="size-[6px] rounded-full" :class="STATUS_DOT_CLASS[task.status]" />
        {{ STATUS_LABEL[task.status] }}
      </span>
    </div>

    <div class="inline-flex items-center gap-1.5 text-sm font-medium" :class="PRIORITY_TEXT_CLASS[task.priority]">
      <component :is="PRIORITY_ICON[task.priority]" class="size-3.5 shrink-0" :stroke-width="2.2" />
      {{ PRIORITY_LABEL[task.priority] }}
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <template v-if="assignees.length">
        <div class="flex shrink-0 items-center">
          <div
            v-for="member in assignees.slice(0, 3)"
            :key="member.id"
            class="-ml-[7px] grid size-6 place-items-center rounded-full border-2 border-card text-[10px] font-semibold text-white first:ml-0"
            :style="{ background: member.avatarGradient }"
            :title="member.name"
          >
            {{ member.initials }}
          </div>
        </div>
        <span v-if="assignees.length === 1" class="truncate text-[13px] font-medium text-muted-foreground">
          {{ assignees[0].name }}
        </span>
        <span v-else class="truncate text-[13px] font-medium text-muted-foreground">
          {{ assignees[0].name }} 외 {{ assignees.length - 1 }}명
        </span>
      </template>
      <span v-else class="text-[13px] text-subtle">미배정</span>
    </div>

    <div class="flex items-center gap-2">
      <div class="h-[6px] flex-1 overflow-hidden rounded-full bg-[#eef0f3]">
        <div
          class="h-full rounded-full"
          :class="task.status === 'done' ? 'bg-status-done-fg' : 'bg-primary'"
          :style="{ width: `${task.progress}%` }"
        />
      </div>
      <span class="w-7 shrink-0 text-right text-xs font-semibold text-muted-foreground">{{ task.progress }}%</span>
    </div>

    <div class="text-[13px] font-medium whitespace-nowrap" :class="due.urgent ? 'font-semibold text-priority-urgent' : 'text-muted-foreground'">
      {{ due.label }}
    </div>
  </router-link>
</template>
