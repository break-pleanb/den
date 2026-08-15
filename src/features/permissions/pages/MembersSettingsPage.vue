<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Trash2, UserPlus } from '@lucide/vue'
import {
  fetchProjectByKey,
  fetchProjectMembers,
  fetchRolesByProjectKey,
  fetchUsers,
  inviteProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/mock/api'
import { CURRENT_USER_ID } from '@/mock/users'
import type { ProjectMember, Role, User } from '@/mock/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { confirm } from '@/lib/confirm'
import { formatInviteDate } from '@/lib/date'
import SettingsTabs from '../components/SettingsTabs.vue'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)
const queryClient = useQueryClient()

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

const { data: roles } = useQuery({
  queryKey: ['roles', projectKey],
  queryFn: () => fetchRolesByProjectKey(projectKey.value),
})

const { data: projectMembers } = useQuery({
  queryKey: ['project-members', projectKey],
  queryFn: () => fetchProjectMembers(projectKey.value),
})

const usersById = computed(() => new Map((users.value ?? []).map((u) => [u.id, u])))
const rolesById = computed(() => new Map((roles.value ?? []).map((r) => [r.id, r])))
const memberEntryByUserId = computed(() => new Map((projectMembers.value ?? []).map((m) => [m.userId, m])))

interface MemberRow {
  user: User
  entry: ProjectMember
  role: Role | undefined
}

const members = computed<MemberRow[]>(() => {
  if (!project.value) return []
  return project.value.memberIds
    .map((id) => {
      const user = usersById.value.get(id)
      const entry = memberEntryByUserId.value.get(id)
      if (!user || !entry) return null
      return { user, entry, role: rolesById.value.get(entry.roleId) }
    })
    .filter((m): m is MemberRow => m !== null)
})

async function invalidateMemberQueries() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['project-members', projectKey.value] }),
    queryClient.invalidateQueries({ queryKey: ['member-roles', projectKey.value] }),
    queryClient.invalidateQueries({ queryKey: ['menu-permissions', projectKey.value] }),
  ])
}

async function onRoleChange(userId: string, roleId: string) {
  await updateProjectMemberRole(projectKey.value, userId, roleId)
  await invalidateMemberQueries()
}

async function onRemove(userId: string, name: string) {
  const ok = await confirm({
    title: '멤버 제거',
    description: `'${name}'님을 이 프로젝트에서 제거할까요? 프로젝트에 더 이상 접근할 수 없게 됩니다.`,
    confirmLabel: '제거',
    destructive: true,
  })
  if (!ok) return
  await removeProjectMember(projectKey.value, userId)
  await invalidateMemberQueries()
  await queryClient.invalidateQueries({ queryKey: ['project', projectKey.value] })
  await queryClient.invalidateQueries({ queryKey: ['projects'] })
}

// ── 멤버 초대 ────────────────────────────────────────────
const inviteOpen = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRoleId = ref('')

const EMAIL_RE = /^\S+@\S+\.\S+$/
const canInvite = computed(
  () => inviteName.value.trim().length > 0 && EMAIL_RE.test(inviteEmail.value.trim()) && !!inviteRoleId.value,
)

function openInvite() {
  inviteName.value = ''
  inviteEmail.value = ''
  inviteRoleId.value = roles.value?.[0]?.id ?? ''
  inviteOpen.value = true
}

async function onInvite() {
  if (!canInvite.value) return
  await inviteProjectMember(projectKey.value, inviteName.value.trim(), inviteEmail.value.trim(), inviteRoleId.value)
  await invalidateMemberQueries()
  await queryClient.invalidateQueries({ queryKey: ['project', projectKey.value] })
  await queryClient.invalidateQueries({ queryKey: ['users'] })
  await queryClient.invalidateQueries({ queryKey: ['projects'] })
  inviteOpen.value = false
}
</script>

<template>
  <div>
    <SettingsTabs :project-key="projectKey" />

    <div class="mb-4 flex items-center gap-3">
      <div class="text-xl font-bold tracking-tight">멤버 관리</div>
      <div class="ml-auto">
        <Button @click="openInvite">
          <UserPlus class="size-[15px]" :stroke-width="2" />
          멤버 초대
        </Button>
      </div>
    </div>

    <div class="overflow-hidden rounded-lg border border-border shadow-card">
      <div
        class="grid grid-cols-[minmax(220px,2fr)_160px_120px_44px] items-center gap-3 border-b border-border bg-[#fcfcfd] px-[18px] py-2.5 text-[11.5px] font-semibold tracking-wide text-subtle uppercase"
      >
        <div>멤버</div>
        <div>역할</div>
        <div>초대일</div>
        <div />
      </div>

      <div
        v-for="{ user, entry } in members"
        :key="user.id"
        class="grid grid-cols-[minmax(220px,2fr)_160px_120px_44px] items-center gap-3 border-b border-border bg-card px-[18px] py-3 last:border-none"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
            :style="{ background: user.avatarGradient }"
          >
            {{ user.initials }}
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-semibold">
              {{ user.name }}
              <span v-if="user.id === CURRENT_USER_ID" class="ml-1 text-xs font-normal text-muted-foreground">(나)</span>
            </div>
            <div class="truncate text-xs text-muted-foreground">{{ user.email }}</div>
          </div>
        </div>

        <Select :model-value="entry.roleId" @update:model-value="(v) => onRoleChange(user.id, v as string)">
          <SelectTrigger class="h-8 w-full text-[13px]">
            <SelectValue placeholder="역할 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</SelectItem>
          </SelectContent>
        </Select>

        <div class="text-xs text-muted-foreground">{{ formatInviteDate(entry.invitedAt) }}</div>

        <button
          type="button"
          class="grid size-7 shrink-0 place-items-center rounded-md text-subtle hover:bg-[#fdeceb] hover:text-priority-urgent disabled:pointer-events-none disabled:opacity-30"
          :disabled="user.id === CURRENT_USER_ID"
          :title="user.id === CURRENT_USER_ID ? '본인은 제거할 수 없습니다' : '멤버 제거'"
          aria-label="멤버 제거"
          @click="onRemove(user.id, user.name)"
        >
          <Trash2 class="size-4" :stroke-width="1.9" />
        </button>
      </div>

      <div v-if="!members.length" class="py-16 text-center text-sm text-muted-foreground">멤버가 없습니다.</div>
    </div>

    <Dialog v-model:open="inviteOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-3" @submit.prevent="onInvite">
          <Input v-model="inviteName" placeholder="이름" autofocus />
          <Input v-model="inviteEmail" type="email" placeholder="이메일" />
          <Select v-model="inviteRoleId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter class="mt-1">
            <Button type="button" variant="outline" @click="inviteOpen = false">취소</Button>
            <Button type="submit" :disabled="!canInvite">초대</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
