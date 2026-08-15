<script setup lang="ts">
import { computed } from 'vue'
import { Star } from '@lucide/vue'
import { STATUS_DOT_CLASS } from '@/lib/constants'
import { confirm } from '@/lib/confirm'
import ProjectActionsMenu from '@/components/ProjectActionsMenu.vue'
import type { Folder, Project, Role, User } from '@/mock/types'

const props = defineProps<{
  project: Project
  stats: { todo: number; progress: number; review: number; done: number; total: number }
  members: User[]
  role?: Role
  isFavorite: boolean
  folders: Folder[]
}>()

const emit = defineEmits<{
  'toggle-favorite': [projectId: string]
  'move-to-folder': [projectId: string, folderId: string | null]
}>()

const visibleMembers = computed(() => props.members.slice(0, 3))
const overflowCount = computed(() => props.members.length - visibleMembers.value.length)

function pct(count: number) {
  return props.stats.total === 0 ? 0 : (count / props.stats.total) * 100
}

async function onStarClick(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
  if (props.isFavorite) {
    const ok = await confirm({
      description: `'${props.project.name}'을(를) 즐겨찾기에서 해제할까요?`,
      confirmLabel: '해제',
      destructive: true,
    })
    if (!ok) return
  }
  emit('toggle-favorite', props.project.id)
}
</script>

<template>
  <router-link
    :to="{ name: 'tasks', params: { projectKey: project.key } }"
    class="group relative block rounded-lg border border-border bg-card p-[18px] shadow-card transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_6px_18px_rgba(16,24,40,.09)]"
  >
    <div class="mb-3.5 flex items-center gap-[11px]">
      <div
        class="grid size-[38px] shrink-0 place-items-center rounded-[10px] text-[15px] font-bold text-white"
        :style="{ background: project.color }"
      >
        {{ project.name.slice(0, 1) }}
      </div>
      <div class="min-w-0">
        <div class="truncate text-[15px] font-bold tracking-tight">{{ project.name }}</div>
        <div class="mt-px text-xs font-medium text-subtle">{{ project.key }}</div>
      </div>
      <button
        type="button"
        class="ml-auto shrink-0"
        :aria-label="isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'"
        @click="onStarClick"
      >
        <Star
          class="size-4"
          :stroke-width="2"
          :class="isFavorite ? 'fill-[#f5b800] text-[#f5b800]' : 'text-[#d1d5db]'"
        />
      </button>
      <ProjectActionsMenu
        :project="project"
        :folders="folders"
        :is-favorite="isFavorite"
        @toggle-favorite="emit('toggle-favorite', $event)"
        @move-to-folder="(projectId, folderId) => emit('move-to-folder', projectId, folderId)"
      />
    </div>

    <div class="mb-4 line-clamp-2 min-h-[40px] text-[13px] leading-[1.55] text-muted-foreground">
      {{ project.description }}
    </div>

    <div class="mb-2.5 flex h-[7px] overflow-hidden rounded-full bg-[#eef0f3]">
      <i class="block h-full" :class="STATUS_DOT_CLASS.done" :style="{ width: pct(stats.done) + '%' }" />
      <i class="block h-full" :class="STATUS_DOT_CLASS.progress" :style="{ width: pct(stats.progress) + '%' }" />
      <i class="block h-full" :class="STATUS_DOT_CLASS.review" :style="{ width: pct(stats.review) + '%' }" />
    </div>

    <div class="mb-3.5 flex items-center gap-3.5 text-xs text-muted-foreground">
      <span class="inline-flex items-center gap-1.5">
        <span class="size-[7px] rounded-full" :class="STATUS_DOT_CLASS.progress" />
        진행 <b class="font-semibold text-foreground">{{ stats.progress }}</b>
      </span>
      <span class="inline-flex items-center gap-1.5">
        <span class="size-[7px] rounded-full" :class="STATUS_DOT_CLASS.done" />
        완료 <b class="font-semibold text-foreground">{{ stats.done }}</b>
      </span>
      <span>전체 <b class="font-semibold text-foreground">{{ stats.total }}</b></span>
    </div>

    <div class="flex items-center justify-between border-t border-border pt-[13px]">
      <div class="flex items-center">
        <div
          v-for="member in visibleMembers"
          :key="member.id"
          class="-ml-[7px] grid size-[26px] place-items-center rounded-full border-2 border-card text-[10px] font-semibold text-white first:ml-0"
          :style="{ background: member.avatarGradient }"
          :title="member.name"
        >
          {{ member.initials }}
        </div>
        <div
          v-if="overflowCount > 0"
          class="-ml-[7px] grid size-[26px] place-items-center rounded-full border-2 border-card bg-[#eef0f3] text-[10px] font-semibold text-muted-foreground"
        >
          +{{ overflowCount }}
        </div>
      </div>
      <span
        v-if="role"
        class="rounded-full px-2.5 py-[3px] text-[11px] font-semibold"
        :class="role.name === '뷰어' ? 'bg-[#f1f2f5] text-[#565d6d]' : 'bg-primary-soft text-primary'"
      >
        {{ role.name }}
      </span>
    </div>
  </router-link>
</template>
