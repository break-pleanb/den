<script setup lang="ts">
import { computed } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { fetchRolesByProjectKey, updateRoleMenuPermission } from '@/mock/api'
import type { MenuKey, Role } from '@/mock/types'
import SettingsTabs from '../components/SettingsTabs.vue'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)
const queryClient = useQueryClient()

const { data: roles } = useQuery({
  queryKey: ['roles', projectKey],
  queryFn: () => fetchRolesByProjectKey(projectKey.value),
})

const menuLabels: Record<MenuKey, string> = { tasks: '업무', gantt: '간트차트', messenger: '메신저' }
const menuKeys = Object.keys(menuLabels) as MenuKey[]

async function onToggle(role: Role, key: MenuKey) {
  await updateRoleMenuPermission(role.id, key, !role.menuPermissions[key])
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['roles', projectKey.value] }),
    queryClient.invalidateQueries({ queryKey: ['member-roles', projectKey.value] }),
    queryClient.invalidateQueries({ queryKey: ['menu-permissions', projectKey.value] }),
  ])
}
</script>

<template>
  <div>
    <SettingsTabs :project-key="projectKey" />

    <div class="mb-1 text-xl font-bold tracking-tight">역할·권한</div>
    <div class="mb-4 text-[13px] text-muted-foreground">
      역할별로 메뉴 접근 여부를 켜고 끌 수 있습니다. 꺼진 메뉴는 해당 역할의 멤버에게 상단 탭에서 보이지 않습니다.
    </div>

    <div class="overflow-hidden rounded-lg border border-border shadow-card">
      <div
        v-for="role in roles"
        :key="role.id"
        class="flex items-center gap-4 border-b border-border px-[18px] py-3.5 last:border-none"
      >
        <div class="w-24 shrink-0">
          <div class="text-sm font-semibold">{{ role.name }}</div>
          <div v-if="role.isAdmin" class="text-[11px] text-muted-foreground">관리자 권한</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="key in menuKeys"
            :key="key"
            type="button"
            role="switch"
            :aria-checked="role.menuPermissions[key]"
            class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="
              role.menuPermissions[key]
                ? 'bg-primary-soft text-primary hover:bg-primary/15'
                : 'bg-muted text-subtle hover:bg-[#eceef2]'
            "
            @click="onToggle(role, key)"
          >
            {{ menuLabels[key] }}
            <span class="ml-1">{{ role.menuPermissions[key] ? 'ON' : 'OFF' }}</span>
          </button>
        </div>
      </div>

      <div v-if="!roles?.length" class="py-16 text-center text-sm text-muted-foreground">역할이 없습니다.</div>
    </div>
  </div>
</template>
