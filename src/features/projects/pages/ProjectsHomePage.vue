<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { FolderPlus, Folder as FolderIcon, LayoutGrid, List, Plus, Search, Star } from '@lucide/vue'
import {
  createFolder,
  createProject,
  fetchAllTasks,
  fetchFavoriteProjectIds,
  fetchFolders,
  fetchMyProjectRoles,
  fetchProjects,
  fetchUsers,
  moveProjectToFolder,
  toggleFavoriteProject,
} from '@/mock/api'
import type { Project, Task, User } from '@/mock/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import NotificationBell from '@/features/notifications/components/NotificationBell.vue'
import ProjectCard from '../components/ProjectCard.vue'
import ProjectListRow from '../components/ProjectListRow.vue'

const UNCLASSIFIED = '__unclassified__'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
const { data: folders } = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
const { data: favoriteIds } = useQuery({ queryKey: ['favorites'], queryFn: fetchFavoriteProjectIds })
const { data: myRoles } = useQuery({ queryKey: ['my-project-roles'], queryFn: fetchMyProjectRoles })
const { data: allTasks } = useQuery({ queryKey: ['all-tasks'], queryFn: fetchAllTasks })
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

// ── URL 상태 (뒤로가기로 복원되어야 함) ──────────────────────
// 입력창은 로컬 ref로 즉시 반응하고, URL 반영은 디바운스 후 router.push로 커밋한다.
// 매 타이핑마다 push하면 뒤로가기 히스토리가 글자 수만큼 쌓이므로, 입력이 잠시 멈췄을 때만
// 하나의 히스토리 항목으로 기록해 뒤로가기 시 검색 이전 상태로 복원되게 한다 (URL 우선 원칙).
const searchTerm = ref((route.query.q as string) ?? '')

watch(
  () => route.query.q,
  (q) => {
    const value = (q as string) ?? ''
    if (value !== searchTerm.value) searchTerm.value = value
  },
)

const commitSearch = useDebounceFn((value: string) => {
  router.push({ query: { ...route.query, q: value || undefined } })
}, 400)

// v-model은 한글 IME 조합 중 input을 무시해 조합이 끝나기 전까지 검색에 반영되지 않는다.
// input 이벤트에서 target.value를 직접 읽어 조합 중에도 즉시 반영되게 한다.
function onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  searchTerm.value = value
  commitSearch(value)
}

const viewMode = computed<'card' | 'list'>(() => (route.query.view === 'list' ? 'list' : 'card'))
function setViewMode(mode: 'card' | 'list') {
  router.push({ query: { ...route.query, view: mode === 'card' ? undefined : mode } })
}

// ── 파생 데이터 ────────────────────────────────────────────
const folderNameById = computed(() => {
  const map = new Map<string, string>()
  for (const folder of folders.value ?? []) map.set(folder.id, folder.name)
  return map
})

const filteredProjects = computed(() => {
  const all = projects.value ?? []
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return all
  return all.filter((p) => {
    const folderName = (p.folderId ? folderNameById.value.get(p.folderId) : '') ?? ''
    return (
      p.name.toLowerCase().includes(term) ||
      p.key.toLowerCase().includes(term) ||
      folderName.toLowerCase().includes(term)
    )
  })
})

const favoriteIdSet = computed(() => new Set(favoriteIds.value ?? []))

const favoriteProjects = computed(() =>
  filteredProjects.value.filter((p) => favoriteIdSet.value.has(p.id)),
)

// 즐겨찾기 섹션에 이미 표시된 프로젝트는 폴더/미분류 섹션에서 제외해 중복 노출을 막는다
const unclassifiedProjects = computed(() =>
  filteredProjects.value.filter((p) => p.folderId === null && !favoriteIdSet.value.has(p.id)),
)

function projectsInFolder(folderId: string) {
  return filteredProjects.value.filter((p) => p.folderId === folderId && !favoriteIdSet.value.has(p.id))
}

const usersById = computed(() => {
  const map = new Map<string, User>()
  for (const user of users.value ?? []) map.set(user.id, user)
  return map
})

function membersOf(project: Project): User[] {
  return project.memberIds.map((id) => usersById.value.get(id)).filter((u): u is User => !!u)
}

const tasksByProjectId = computed(() => {
  const map = new Map<string, Task[]>()
  for (const task of allTasks.value ?? []) {
    const list = map.get(task.projectId)
    if (list) list.push(task)
    else map.set(task.projectId, [task])
  }
  return map
})

function statsOf(project: Project) {
  const tasks = tasksByProjectId.value.get(project.id) ?? []
  const stats = { todo: 0, progress: 0, review: 0, done: 0, total: tasks.length }
  for (const task of tasks) stats[task.status]++
  return stats
}

function roleOf(project: Project) {
  return myRoles.value?.[project.id]
}

async function onToggleFavorite(projectId: string) {
  await toggleFavoriteProject(projectId)
  await queryClient.invalidateQueries({ queryKey: ['favorites'] })
}

async function onMoveToFolder(projectId: string, folderId: string | null) {
  await moveProjectToFolder(projectId, folderId)
  await queryClient.invalidateQueries({ queryKey: ['projects'] })
}

// ── 새 폴더 / 새 프로젝트 생성 ────────────────────────────────
const newFolderOpen = ref(false)
const newFolderName = ref('')

async function onCreateFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  await createFolder(name)
  await queryClient.invalidateQueries({ queryKey: ['folders'] })
  newFolderName.value = ''
  newFolderOpen.value = false
}

const newProjectOpen = ref(false)
const newProjectName = ref('')
const newProjectFolderId = ref(UNCLASSIFIED)

async function onCreateProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  const folderId = newProjectFolderId.value === UNCLASSIFIED ? null : newProjectFolderId.value
  await createProject(name, folderId)
  await queryClient.invalidateQueries({ queryKey: ['projects'] })
  await queryClient.invalidateQueries({ queryKey: ['my-project-roles'] })
  newProjectName.value = ''
  newProjectFolderId.value = UNCLASSIFIED
  newProjectOpen.value = false
}
</script>

<template>
  <div>
    <div class="mb-[22px] flex items-start gap-4">
      <div>
        <div class="text-2xl font-bold tracking-tight">전체 프로젝트</div>
        <div class="mt-1 text-[13px] text-muted-foreground">
          {{ projects?.length ?? 0 }}개 프로젝트에 참여 중 · 즐겨찾기 {{ favoriteIds?.length ?? 0 }}개
        </div>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Button variant="outline" @click="newFolderOpen = true">
          <FolderPlus class="size-[15px]" :stroke-width="2" />
          새 폴더
        </Button>
        <Button @click="newProjectOpen = true">
          <Plus class="size-[15px]" :stroke-width="2" />
          새 프로젝트
        </Button>
        <NotificationBell />
      </div>
    </div>

    <Dialog v-model:open="newFolderOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>새 폴더</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="onCreateFolder">
          <Input v-model="newFolderName" placeholder="폴더 이름" autofocus />
          <DialogFooter class="mt-4">
            <Button type="button" variant="outline" @click="newFolderOpen = false">취소</Button>
            <Button type="submit" :disabled="!newFolderName.trim()">만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="newProjectOpen">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>새 프로젝트</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="onCreateProject">
          <div class="flex flex-col gap-3">
            <Input v-model="newProjectName" placeholder="프로젝트 이름" autofocus />
            <Select v-model="newProjectFolderId">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="폴더 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem :value="UNCLASSIFIED">미분류</SelectItem>
                <SelectItem v-for="folder in folders" :key="folder.id" :value="folder.id">
                  {{ folder.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter class="mt-4">
            <Button type="button" variant="outline" @click="newProjectOpen = false">취소</Button>
            <Button type="submit" :disabled="!newProjectName.trim()">만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <div class="mb-6 flex items-center gap-2.5">
      <div
        class="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-[9px] border border-border-strong bg-card px-[13px] py-[9px] text-subtle"
      >
        <Search class="size-4 shrink-0" :stroke-width="2" />
        <input
          :value="searchTerm"
          placeholder="프로젝트 이름, 폴더로 검색..."
          class="w-full border-none bg-transparent text-sm text-foreground outline-none placeholder:text-subtle"
          @input="onSearchInput"
        />
      </div>
      <div class="inline-flex gap-0.5 rounded-[9px] border border-border-strong bg-card p-[3px]">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground"
          :class="viewMode === 'card' ? 'bg-primary font-semibold text-primary-foreground' : ''"
          @click="setViewMode('card')"
        >
          <LayoutGrid class="size-3.5" :stroke-width="2" />
          카드
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground"
          :class="viewMode === 'list' ? 'bg-primary font-semibold text-primary-foreground' : ''"
          @click="setViewMode('list')"
        >
          <List class="size-3.5" :stroke-width="2" />
          목록
        </button>
      </div>
    </div>

    <div v-if="!filteredProjects.length" class="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
      "{{ searchTerm }}"에 해당하는 프로젝트가 없습니다.
    </div>

    <template v-else>
      <!-- 즐겨찾기 -->
      <div v-if="favoriteProjects.length" class="mb-8">
        <div class="mb-3.5 flex items-center gap-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
          <Star class="size-[15px] fill-[#f5b800] text-[#f5b800]" :stroke-width="2.2" />
          즐겨찾기
          <span class="rounded-full bg-[#eef0f3] px-2 py-px text-[11px] font-semibold text-subtle">{{ favoriteProjects.length }}</span>
        </div>
        <div v-if="viewMode === 'card'" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          <ProjectCard
            v-for="project in favoriteProjects"
            :key="project.id"
            :project="project"
            :stats="statsOf(project)"
            :members="membersOf(project)"
            :role="roleOf(project)"
            :is-favorite="true"
            :folders="folders ?? []"
            @toggle-favorite="onToggleFavorite"
            @move-to-folder="onMoveToFolder"
          />
        </div>
        <div v-else class="overflow-hidden rounded-lg border border-border shadow-card">
          <ProjectListRow
            v-for="project in favoriteProjects"
            :key="project.id"
            :project="project"
            :stats="statsOf(project)"
            :members="membersOf(project)"
            :role="roleOf(project)"
            :is-favorite="true"
            :folders="folders ?? []"
            @toggle-favorite="onToggleFavorite"
            @move-to-folder="onMoveToFolder"
          />
        </div>
      </div>

      <!-- 폴더별 -->
      <div v-for="folder in folders" :key="folder.id" class="mb-8">
        <template v-if="projectsInFolder(folder.id).length">
          <div class="mb-3.5 flex items-center gap-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
            <FolderIcon class="size-[15px] text-subtle" :stroke-width="2" />
            {{ folder.name }}
            <span class="rounded-full bg-[#eef0f3] px-2 py-px text-[11px] font-semibold text-subtle">{{ projectsInFolder(folder.id).length }}</span>
          </div>
          <div v-if="viewMode === 'card'" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            <ProjectCard
              v-for="project in projectsInFolder(folder.id)"
              :key="project.id"
              :project="project"
              :stats="statsOf(project)"
              :members="membersOf(project)"
              :role="roleOf(project)"
              :is-favorite="false"
              :folders="folders ?? []"
              @toggle-favorite="onToggleFavorite"
              @move-to-folder="onMoveToFolder"
            />
          </div>
          <div v-else class="overflow-hidden rounded-lg border border-border shadow-card">
            <ProjectListRow
              v-for="project in projectsInFolder(folder.id)"
              :key="project.id"
              :project="project"
              :stats="statsOf(project)"
              :members="membersOf(project)"
              :role="roleOf(project)"
              :is-favorite="false"
              :folders="folders ?? []"
              @toggle-favorite="onToggleFavorite"
              @move-to-folder="onMoveToFolder"
            />
          </div>
        </template>
      </div>

      <!-- 미분류 -->
      <div v-if="unclassifiedProjects.length" class="mb-8">
        <div class="mb-3.5 flex items-center gap-2 px-0.5 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
          미분류
          <span class="rounded-full bg-[#eef0f3] px-2 py-px text-[11px] font-semibold text-subtle">{{ unclassifiedProjects.length }}</span>
        </div>
        <div v-if="viewMode === 'card'" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          <ProjectCard
            v-for="project in unclassifiedProjects"
            :key="project.id"
            :project="project"
            :stats="statsOf(project)"
            :members="membersOf(project)"
            :role="roleOf(project)"
            :is-favorite="false"
            :folders="folders ?? []"
            @toggle-favorite="onToggleFavorite"
            @move-to-folder="onMoveToFolder"
          />
        </div>
        <div v-else class="overflow-hidden rounded-lg border border-border shadow-card">
          <ProjectListRow
            v-for="project in unclassifiedProjects"
            :key="project.id"
            :project="project"
            :stats="statsOf(project)"
            :members="membersOf(project)"
            :role="roleOf(project)"
            :is-favorite="false"
            :folders="folders ?? []"
            @toggle-favorite="onToggleFavorite"
            @move-to-folder="onMoveToFolder"
          />
        </div>
      </div>
    </template>
  </div>
</template>
