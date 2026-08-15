<script setup lang="ts">
import { ref } from 'vue'
import type { LocationQueryRaw } from 'vue-router'
import { Plus, TriangleAlert, X } from '@lucide/vue'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '@/lib/constants'
import type { Task, TaskStatus } from '@/mock/types'

const props = defineProps<{
  projectKey: string
  currentStatus: TaskStatus
  dependencies: Task[]
  options: Task[]
  selectedIds: string[]
  blockedIds: Set<string>
  query: LocationQueryRaw
}>()
const emit = defineEmits<{ 'update:selectedIds': [string[]] }>()

const cycleWarning = ref(false)

function toggle(id: string, checked: boolean) {
  if (checked && props.blockedIds.has(id)) {
    cycleWarning.value = true
    return
  }
  cycleWarning.value = false
  const next = checked ? [...props.selectedIds, id] : props.selectedIds.filter((v) => v !== id)
  emit('update:selectedIds', next)
}

function isUnfinished(dep: Task) {
  return props.currentStatus === 'progress' && dep.status !== 'done'
}
</script>

<template>
  <div>
    <ul v-if="dependencies.length" class="divide-y divide-border overflow-hidden rounded-lg border border-border">
      <li v-for="dep in dependencies" :key="dep.id" class="flex items-center gap-2.5 px-3 py-2">
        <span class="shrink-0 rounded-full px-2 py-px text-[11px] font-semibold" :class="STATUS_BADGE_CLASS[dep.status]">
          {{ STATUS_LABEL[dep.status] }}
        </span>
        <router-link
          :to="{ name: 'task-detail', params: { projectKey, taskId: dep.id }, query }"
          class="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground hover:text-primary"
        >
          <span class="mr-1.5 font-mono text-xs text-subtle">{{ dep.code }}</span>{{ dep.title }}
        </router-link>
        <TriangleAlert
          v-if="isUnfinished(dep)"
          class="size-3.5 shrink-0 text-priority-high"
          :stroke-width="2.2"
          aria-label="선행 업무 미완료"
        />
        <button type="button" class="shrink-0 text-subtle hover:text-destructive" :aria-label="`${dep.code} 선행 업무 해제`" @click="toggle(dep.id, false)">
          <X class="size-3.5" :stroke-width="2.4" />
        </button>
      </li>
    </ul>
    <p v-else class="text-[13px] text-subtle">선행 업무가 없습니다.</p>
    <p v-if="dependencies.some(isUnfinished)" class="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-priority-high">
      <TriangleAlert class="size-3.5 shrink-0" :stroke-width="2.2" />
      진행 중인 업무인데 아직 끝나지 않은 선행 업무가 있습니다.
    </p>

    <DropdownMenu @update:open="(open) => { if (!open) cycleWarning = false }">
      <DropdownMenuTrigger as-child>
        <button
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 rounded-[9px] border border-dashed border-border-strong px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus class="size-3.5" :stroke-width="2.4" />
          선행 업무 추가
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" class="w-64">
        <DropdownMenuLabel>선행 업무 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          v-for="task in options"
          :key="task.id"
          :model-value="selectedIds.includes(task.id)"
          :class="blockedIds.has(task.id) && !selectedIds.includes(task.id) ? 'opacity-50' : ''"
          @select.prevent
          @update:model-value="(checked) => toggle(task.id, checked as boolean)"
        >
          <span class="flex min-w-0 items-center gap-1.5 truncate">
            <span class="mr-1 font-mono text-xs text-subtle">{{ task.code }}</span>{{ task.title }}
            <TriangleAlert
              v-if="blockedIds.has(task.id) && !selectedIds.includes(task.id)"
              class="size-3 shrink-0 text-priority-high"
              :stroke-width="2.2"
            />
          </span>
        </DropdownMenuCheckboxItem>
        <p v-if="!options.length" class="px-2 py-1.5 text-xs text-subtle">선택 가능한 업무가 없습니다.</p>
        <p v-if="cycleWarning" class="mt-1 flex items-start gap-1.5 border-t border-border px-2 pt-2 text-xs font-medium text-destructive">
          <TriangleAlert class="mt-px size-3.5 shrink-0" :stroke-width="2.2" />
          이미 선행 관계로 연결되어 있어 순환 참조가 발생하는 업무입니다.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
