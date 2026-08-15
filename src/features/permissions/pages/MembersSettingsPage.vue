<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { fetchProjectByKey, fetchProjectMemberRoles, fetchUsers } from '@/mock/api'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

const { data: memberRoles } = useQuery({
  queryKey: ['member-roles', projectKey],
  queryFn: () => fetchProjectMemberRoles(projectKey.value),
})

const members = computed(() => {
  if (!project.value) return []
  return (users.value ?? [])
    .filter((u) => project.value!.memberIds.includes(u.id))
    .map((u) => ({ user: u, role: memberRoles.value?.[u.id] }))
})
</script>

<template>
  <div>
    <div class="mb-4 text-xl font-bold tracking-tight">멤버 관리</div>
    <div class="rounded-lg border border-border bg-card shadow-card">
      <div
        v-for="{ user, role } in members"
        :key="user.id"
        class="flex items-center gap-3 border-b border-border px-4 py-3 last:border-none"
      >
        <div
          class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
          :style="{ background: user.avatarGradient }"
        >
          {{ user.initials }}
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">{{ user.name }}</div>
          <div class="truncate text-xs text-muted-foreground">{{ user.email }}</div>
        </div>
        <span class="ml-auto text-xs font-medium text-muted-foreground">{{ role?.name ?? '-' }}</span>
      </div>
    </div>
  </div>
</template>
