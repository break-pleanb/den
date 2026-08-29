<script setup lang="ts">
import { computed } from 'vue'
import { formatActivityMessage } from '@/lib/activity'
import { formatRelativeTime } from '@/lib/date'
import type { TaskActivity, User } from '@/mock/types'

const props = defineProps<{
  activities: TaskActivity[]
  usersById: Record<string, User>
}>()

const sorted = computed(() => [...props.activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
</script>

<template>
  <ul v-if="sorted.length" class="space-y-2.5">
    <li v-for="activity in sorted" :key="activity.id" class="text-[13px] leading-relaxed text-foreground">
      <span class="font-semibold">{{ usersById[activity.changedById]?.name ?? '알 수 없음' }}</span>님이
      {{ formatActivityMessage(activity, usersById) }}
      <span class="text-[11px] text-subtle">· {{ formatRelativeTime(activity.createdAt) }}</span>
    </li>
  </ul>
  <p v-else class="text-[13px] text-subtle">아직 변경 이력이 없습니다.</p>
</template>
