<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useDebounceFn } from '@vueuse/core'
import { Search, Trash2, UserPlus, X } from '@lucide/vue'
import {
  fetchProjectMembers,
  fetchRolesByProjectKey,
  inviteProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/api/permissions'
import { fetchProjectByKey } from '@/api/projects'
import { fetchProjectUsers, searchUsers } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import type { ProjectMember, Role, User } from '@/mock/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { confirm } from '@/lib/confirm'
import { formatInviteDate } from '@/lib/date'
import SettingsTabs from '../components/SettingsTabs.vue'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)
const queryClient = useQueryClient()
const authStore = useAuthStore()
const currentUserId = computed(() => authStore.currentUser?.id)

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: users } = useQuery({
  queryKey: ['project-users', projectKey],
  queryFn: () => fetchProjectUsers(projectKey.value),
})

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

const errorMessage = ref('')

function messageOf(error: unknown, fallback: string, statusMessages: Record<number, string> = {}) {
  if (axios.isAxiosError(error) && error.response?.status && statusMessages[error.response.status]) {
    return statusMessages[error.response.status]
  }
  return fallback
}

async function invalidateMemberQueries() {
  // refetchType: 'all' — 지금 이 화면에 없어 비활성 상태인 쿼리(업무 상세 담당자 피커, 메신저 멘션 후보 등)도
  // 즉시 다시 받아와서, 다음에 그 화면으로 이동했을 때 새로 초대된 멤버가 바로 후보에 보이게 한다
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['project-members', projectKey.value], refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: ['member-roles', projectKey.value], refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: ['menu-permissions', projectKey.value], refetchType: 'all' }),
    queryClient.invalidateQueries({ queryKey: ['project-users', projectKey.value], refetchType: 'all' }),
  ])
}

async function onRoleChange(userId: string, roleId: string) {
  errorMessage.value = ''
  try {
    await updateProjectMemberRole(projectKey.value, userId, roleId)
    await invalidateMemberQueries()
  } catch (error) {
    errorMessage.value = messageOf(error, '역할 변경에 실패했습니다.', {
      403: '관리자만 멤버 역할을 변경할 수 있습니다.',
      409: '이 프로젝트의 마지막 관리자는 다른 역할로 바꿀 수 없습니다.',
    })
  }
}

async function onRemove(userId: string, name: string) {
  const ok = await confirm({
    title: '멤버 제거',
    description: `'${name}'님을 이 프로젝트에서 제거할까요? 프로젝트에 더 이상 접근할 수 없게 됩니다.`,
    confirmLabel: '제거',
    destructive: true,
  })
  if (!ok) return
  errorMessage.value = ''
  try {
    await removeProjectMember(projectKey.value, userId)
    await invalidateMemberQueries()
    await queryClient.invalidateQueries({ queryKey: ['project', projectKey.value] })
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
  } catch (error) {
    errorMessage.value = messageOf(error, '멤버 제거에 실패했습니다.', {
      403: '관리자만 멤버를 제거할 수 있습니다.',
      409: '이 프로젝트의 마지막 관리자는 제거할 수 없습니다.',
    })
  }
}

// ── 멤버 초대 (기존 계정 검색) ────────────────────────────────
const inviteOpen = ref(false)
const inviteQuery = ref('')
const inviteResults = ref<User[]>([])
const inviteSearching = ref(false)
const inviteSelected = ref<User | null>(null)
const inviteRoleId = ref('')
const inviteError = ref('')
const inviteSubmitting = ref(false)

const memberIdSet = computed(() => new Set(project.value?.memberIds ?? []))

const runInviteSearch = useDebounceFn(async (q: string) => {
  if (!q.trim()) {
    inviteResults.value = []
    inviteSearching.value = false
    return
  }
  try {
    const results = await searchUsers(q.trim())
    inviteResults.value = results.filter((u) => !memberIdSet.value.has(u.id))
  } finally {
    inviteSearching.value = false
  }
}, 300)

function onInviteQueryInput(event: Event) {
  inviteQuery.value = (event.target as HTMLInputElement).value
  inviteSelected.value = null
  inviteSearching.value = true
  runInviteSearch(inviteQuery.value)
}

function pickInviteUser(user: User) {
  inviteSelected.value = user
  inviteResults.value = []
  inviteQuery.value = ''
}

const canInvite = computed(() => !!inviteSelected.value && !!inviteRoleId.value)

function openInvite() {
  inviteQuery.value = ''
  inviteResults.value = []
  inviteSelected.value = null
  inviteRoleId.value = roles.value?.[0]?.id ?? ''
  inviteError.value = ''
  inviteOpen.value = true
}

async function onInvite() {
  if (!canInvite.value || !inviteSelected.value) return
  inviteError.value = ''
  inviteSubmitting.value = true
  try {
    await inviteProjectMember(projectKey.value, inviteSelected.value.id, inviteRoleId.value)
    await invalidateMemberQueries()
    await queryClient.invalidateQueries({ queryKey: ['project', projectKey.value] })
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    inviteOpen.value = false
  } catch (error) {
    inviteError.value = messageOf(error, '초대에 실패했습니다.', {
      403: '관리자만 멤버를 초대할 수 있습니다.',
      404: '존재하지 않는 사용자입니다.',
      409: '이미 이 프로젝트의 멤버입니다.',
    })
  } finally {
    inviteSubmitting.value = false
  }
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

    <p v-if="errorMessage" class="mb-4 text-[13px] text-destructive">{{ errorMessage }}</p>

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
              <span v-if="user.id === currentUserId" class="ml-1 text-xs font-normal text-muted-foreground">(나)</span>
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
          :disabled="user.id === currentUserId"
          :title="user.id === currentUserId ? '본인은 제거할 수 없습니다' : '멤버 제거'"
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
          <div v-if="inviteSelected" class="flex items-center gap-2.5 rounded-[9px] border border-border-strong bg-background px-3 py-2">
            <div
              class="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
              :style="{ background: inviteSelected.avatarGradient }"
            >
              {{ inviteSelected.initials }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] font-semibold">{{ inviteSelected.name }}</div>
              <div class="truncate text-xs text-muted-foreground">{{ inviteSelected.email }}</div>
            </div>
            <button
              type="button"
              class="shrink-0 text-subtle hover:text-destructive"
              aria-label="선택 해제"
              @click="inviteSelected = null"
            >
              <X class="size-4" :stroke-width="2" />
            </button>
          </div>

          <div v-else class="relative">
            <div
              class="flex items-center gap-2 rounded-[9px] border border-border-strong bg-background px-2.5 py-[7px] text-subtle focus-within:border-primary"
            >
              <Search class="size-3.5 shrink-0" :stroke-width="2" />
              <input
                :value="inviteQuery"
                placeholder="이름 또는 이메일로 검색..."
                autofocus
                class="w-full border-none bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
                @input="onInviteQueryInput"
              />
            </div>
            <div
              v-if="inviteQuery.trim()"
              class="absolute top-full right-0 left-0 z-10 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md"
            >
              <p v-if="inviteSearching" class="px-3 py-2 text-xs text-subtle">검색 중...</p>
              <template v-else-if="inviteResults.length">
                <button
                  v-for="user in inviteResults"
                  :key="user.id"
                  type="button"
                  class="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent"
                  @click="pickInviteUser(user)"
                >
                  <div
                    class="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                    :style="{ background: user.avatarGradient }"
                  >
                    {{ user.initials }}
                  </div>
                  <div class="min-w-0">
                    <div class="truncate text-[13px] font-semibold">{{ user.name }}</div>
                    <div class="truncate text-xs text-muted-foreground">{{ user.email }}</div>
                  </div>
                </button>
              </template>
              <p v-else class="px-3 py-2 text-xs text-subtle">일치하는 사용자가 없습니다.</p>
            </div>
          </div>

          <Select v-model="inviteRoleId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</SelectItem>
            </SelectContent>
          </Select>

          <p v-if="inviteError" class="text-[13px] text-destructive">{{ inviteError }}</p>

          <DialogFooter class="mt-1">
            <Button type="button" variant="outline" @click="inviteOpen = false">취소</Button>
            <Button type="submit" :disabled="!canInvite || inviteSubmitting">
              {{ inviteSubmitting ? '초대 중...' : '초대' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
