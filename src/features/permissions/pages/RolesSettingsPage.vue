<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchRolesByProjectKey } from '@/mock/api'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)

const { data: roles } = useQuery({
  queryKey: ['roles', projectKey],
  queryFn: () => fetchRolesByProjectKey(projectKey.value),
})

const menuLabels = { tasks: '업무', gantt: '간트차트', messenger: '메신저' } as const
</script>

<template>
  <div>
    <div class="mb-4 text-xl font-bold tracking-tight">역할·권한</div>
    <div class="rounded-lg border border-border bg-card shadow-card">
      <div
        v-for="role in roles"
        :key="role.id"
        class="flex items-center gap-4 border-b border-border px-4 py-3 last:border-none"
      >
        <div class="w-20 shrink-0 text-sm font-semibold">{{ role.name }}</div>
        <div class="flex gap-2">
          <span
            v-for="(label, key) in menuLabels"
            :key="key"
            class="rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="role.menuPermissions[key] ? 'bg-primary-soft text-primary' : 'bg-muted text-subtle'"
          >
            {{ label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
