<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Clock,
  Folder as FolderIcon,
  LayoutGrid,
  ListChecks,
  LogOut,
  Plus,
  Search,
  Star,
} from '@lucide/vue'
import {
  fetchFavoriteProjectIds,
  fetchFolders,
  fetchProjects,
  moveProjectToFolder,
  toggleFavoriteProject,
} from '@/api/projects'
import { fetchMyTaskCount } from '@/api/tasks'
import type { Project } from '@/mock/types'
import { useAuthStore } from '@/stores/auth'
import { confirm } from '@/lib/confirm'
import ProjectActionsMenu from '@/components/ProjectActionsMenu.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const authStore = useAuthStore()

function onLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

const searchTerm = ref('')

// v-model은 한글 IME 조합 중 input을 무시해 조합이 끝나기 전까지 검색에 반영되지 않는다.
// input 이벤트에서 target.value를 직접 읽어 조합 중에도 즉시 반영되게 한다.
function onSearchInput(event: Event) {
  searchTerm.value = (event.target as HTMLInputElement).value
}

const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
const { data: folders } = useQuery({ queryKey: ['folders'], queryFn: fetchFolders })
const { data: favoriteIds } = useQuery({ queryKey: ['favorites'], queryFn: fetchFavoriteProjectIds })
const { data: myTaskCount } = useQuery({ queryKey: ['my-task-count'], queryFn: fetchMyTaskCount })

const filteredProjects = computed(() => {
  const all = projects.value ?? []
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return all
  return all.filter((p) => p.name.toLowerCase().includes(term))
})

const favoriteProjects = computed(() => {
  const ids = favoriteIds.value ?? []
  return filteredProjects.value.filter((p) => ids.includes(p.id))
})

const unclassifiedProjects = computed(() =>
  filteredProjects.value.filter((p) => p.folderId === null),
)

function projectsInFolder(folderId: string) {
  const list = filteredProjects.value
  return list.filter((p) => p.folderId === folderId)
}

const activeProjectKey = computed(() => route.params.projectKey as string | undefined)
const isProjectsHomeActive = computed(() => route.name === 'projects-home')

const favoritesCollapsed = ref(false)
const foldersCollapsed = ref(false)
const unclassifiedCollapsed = ref(false)
const folderCollapsedMap = reactive<Record<string, boolean>>({})

function isFolderCollapsed(folderId: string, defaultCollapsed?: boolean) {
  if (!(folderId in folderCollapsedMap)) folderCollapsedMap[folderId] = defaultCollapsed ?? false
  return folderCollapsedMap[folderId]
}

function toggleFolder(folderId: string, defaultCollapsed?: boolean) {
  folderCollapsedMap[folderId] = !isFolderCollapsed(folderId, defaultCollapsed)
}

function isFavorite(projectId: string) {
  return (favoriteIds.value ?? []).includes(projectId)
}

async function applyFavoriteToggle(project: Project) {
  const { isFavorite } = await toggleFavoriteProject(project.key)
  queryClient.setQueryData<string[]>(['favorites'], (ids) => {
    const list = ids ?? []
    if (isFavorite) return list.includes(project.id) ? list : [...list, project.id]
    return list.filter((id) => id !== project.id)
  })
}

async function onToggleFavorite(event: MouseEvent, project: Project) {
  event.stopPropagation()
  event.preventDefault()
  const ok = await confirm({
    description: `'${project.name}'을(를) 즐겨찾기에서 해제할까요?`,
    confirmLabel: '해제',
    destructive: true,
  })
  if (!ok) return
  await applyFavoriteToggle(project)
}

// ProjectActionsMenu는 해제 시 확인을 이미 자체적으로 처리하므로 여기서는 바로 토글한다
async function onMenuToggleFavorite(project: Project) {
  await applyFavoriteToggle(project)
}

async function onMoveToFolder(project: Project, folderId: string | null) {
  await moveProjectToFolder(project.key, folderId)
  await queryClient.invalidateQueries({ queryKey: ['projects'] })
}
</script>

<template>
  <aside class="flex w-[264px] shrink-0 flex-col border-r border-border bg-card">
    <div class="flex items-center gap-2.5 px-4 pt-4 pb-3">
      <div
        class="grid size-[30px] place-items-center rounded-lg bg-primary text-[15px] font-bold text-primary-foreground shadow-[0_2px_6px_rgba(79,70,229,.35)]"
      >
        d
      </div>
      <div class="text-[15px] font-bold tracking-tight">
        den
        <small class="block text-[11px] font-medium text-subtle">프로젝트 관리</small>
      </div>
    </div>

    <div
      class="mx-3 mt-1 mb-2.5 flex items-center gap-2 rounded-[9px] border border-border-strong bg-background px-2.5 py-[7px] text-subtle"
    >
      <Search class="size-3.5 shrink-0" :stroke-width="2" />
      <input
        :value="searchTerm"
        placeholder="프로젝트 검색..."
        class="w-full border-none bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
        @input="onSearchInput"
      />
    </div>

    <div class="flex-1 overflow-y-auto px-2 pb-2">
      <!-- 고정 상단 메뉴 -->
      <div class="mb-1.5 border-b border-border pb-1.5">
        <router-link
          :to="{ name: 'projects-home' }"
          class="mb-0.5 flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 font-medium text-muted-foreground transition-colors hover:bg-[#f4f5f7] hover:text-foreground"
          exact-active-class="!bg-primary-soft !text-primary font-semibold"
        >
          <LayoutGrid class="size-[17px] shrink-0" :stroke-width="1.9" />
          전체 프로젝트
          <span
            class="ml-auto rounded-full px-[7px] py-px text-[11px] font-semibold"
            :class="isProjectsHomeActive ? 'bg-card text-primary' : 'bg-[#eef0f3] text-muted-foreground'"
          >
            {{ projects?.length ?? 0 }}
          </span>
        </router-link>
        <div
          class="mb-0.5 flex cursor-default items-center gap-2.5 rounded-[9px] px-2.5 py-2 font-medium text-muted-foreground"
        >
          <ListChecks class="size-[17px] shrink-0" :stroke-width="1.9" />
          내 업무
          <span
            class="ml-auto rounded-full bg-[#eef0f3] px-[7px] py-px text-[11px] font-semibold text-muted-foreground"
          >
            {{ myTaskCount ?? 0 }}
          </span>
        </div>
        <div
          class="flex cursor-default items-center gap-2.5 rounded-[9px] px-2.5 py-2 font-medium text-muted-foreground"
        >
          <Clock class="size-[17px] shrink-0" :stroke-width="1.9" />
          최근 본 항목
        </div>
      </div>

      <!-- 즐겨찾기 -->
      <button
        type="button"
        class="flex w-full cursor-pointer select-none items-center gap-1.5 px-2.5 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-subtle uppercase"
        @click="favoritesCollapsed = !favoritesCollapsed"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="size-3 shrink-0 transition-transform"
          :class="{ '-rotate-90': favoritesCollapsed }"
          stroke-width="2.4"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        즐겨찾기
      </button>
      <template v-if="!favoritesCollapsed">
        <router-link
          v-for="project in favoriteProjects"
          :key="project.id"
          :to="{ name: 'tasks', params: { projectKey: project.key } }"
          class="group mb-px flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] font-medium text-muted-foreground hover:bg-[#f4f5f7] hover:text-foreground"
          :class="{ '!bg-primary-soft !text-primary font-semibold': activeProjectKey === project.key }"
        >
          <span class="size-2 shrink-0 rounded-full" :style="{ background: project.color }" />
          <span class="truncate">{{ project.name }}</span>
          <button type="button" class="ml-auto shrink-0" @click="onToggleFavorite($event, project)">
            <Star class="size-3.5 fill-[#f5b800] text-[#f5b800]" :stroke-width="2" />
          </button>
          <ProjectActionsMenu
            :project="project"
            :folders="folders ?? []"
            :is-favorite="true"
            @toggle-favorite="onMenuToggleFavorite"
            @move-to-folder="onMoveToFolder"
          />
        </router-link>
      </template>

      <!-- 폴더 -->
      <button
        type="button"
        class="flex w-full cursor-pointer select-none items-center gap-1.5 px-2.5 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-subtle uppercase"
        @click="foldersCollapsed = !foldersCollapsed"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="size-3 shrink-0 transition-transform"
          :class="{ '-rotate-90': foldersCollapsed }"
          stroke-width="2.4"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        폴더
        <span class="ml-auto grid size-5 place-items-center rounded-md text-subtle hover:bg-[#f4f5f7] hover:text-foreground">
          <Plus class="size-[13px]" :stroke-width="2.2" />
        </span>
      </button>

      <template v-if="!foldersCollapsed">
        <div v-for="folder in folders" :key="folder.id" class="mb-px">
          <button
            type="button"
            class="flex w-full items-center gap-1.5 rounded-[9px] px-2.5 py-[7px] text-left text-[13px] font-semibold text-foreground hover:bg-[#f4f5f7]"
            @click="toggleFolder(folder.id, folder.collapsed)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              class="size-3.5 shrink-0 text-subtle transition-transform"
              :class="{ '-rotate-90': isFolderCollapsed(folder.id, folder.collapsed) }"
              stroke-width="2.4"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
            <FolderIcon class="size-[15px] shrink-0 text-muted-foreground" :stroke-width="2" />
            {{ folder.name }}
            <span class="ml-auto text-[11px] font-semibold text-subtle">{{ projectsInFolder(folder.id).length }}</span>
          </button>
          <div v-if="!isFolderCollapsed(folder.id, folder.collapsed)" class="pl-3.5">
            <router-link
              v-for="project in projectsInFolder(folder.id)"
              :key="project.id"
              :to="{ name: 'tasks', params: { projectKey: project.key } }"
              class="group mb-px flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] font-medium text-muted-foreground hover:bg-[#f4f5f7] hover:text-foreground"
              :class="{ '!bg-primary-soft !text-primary font-semibold': activeProjectKey === project.key }"
            >
              <span class="size-2 shrink-0 rounded-full" :style="{ background: project.color }" />
              <span class="truncate">{{ project.name }}</span>
              <ProjectActionsMenu
                :project="project"
                :folders="folders ?? []"
                :is-favorite="isFavorite(project.id)"
                trigger-class="ml-auto"
                @toggle-favorite="onMenuToggleFavorite"
                @move-to-folder="onMoveToFolder"
              />
            </router-link>
          </div>
        </div>
      </template>

      <!-- 미분류 -->
      <template v-if="unclassifiedProjects.length">
        <button
          type="button"
          class="flex w-full cursor-pointer select-none items-center gap-1.5 px-2.5 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-subtle uppercase"
          @click="unclassifiedCollapsed = !unclassifiedCollapsed"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="size-3 shrink-0 transition-transform"
            :class="{ '-rotate-90': unclassifiedCollapsed }"
            stroke-width="2.4"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          미분류
        </button>
        <template v-if="!unclassifiedCollapsed">
          <router-link
            v-for="project in unclassifiedProjects"
            :key="project.id"
            :to="{ name: 'tasks', params: { projectKey: project.key } }"
            class="group mb-px flex items-center gap-2.5 rounded-[9px] px-2.5 py-[7px] text-[13.5px] font-medium text-muted-foreground hover:bg-[#f4f5f7] hover:text-foreground"
            :class="{ '!bg-primary-soft !text-primary font-semibold': activeProjectKey === project.key }"
          >
            <span class="size-2 shrink-0 rounded-full" :style="{ background: project.color }" />
            <span class="truncate">{{ project.name }}</span>
            <ProjectActionsMenu
              :project="project"
              :folders="folders ?? []"
              :is-favorite="isFavorite(project.id)"
              trigger-class="ml-auto"
              @toggle-favorite="onMenuToggleFavorite"
              @move-to-folder="onMoveToFolder"
            />
          </router-link>
        </template>
      </template>
    </div>

    <div class="border-t border-border p-2">
      <DropdownMenu v-if="authStore.currentUser">
        <DropdownMenuTrigger as-child>
          <button type="button" class="flex w-full items-center gap-2.5 rounded-[9px] p-2 text-left hover:bg-[#f4f5f7]">
            <div
              class="grid size-[30px] shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
              :style="{ background: authStore.currentUser.avatarGradient }"
            >
              {{ authStore.currentUser.initials }}
            </div>
            <div>
              <div class="text-[13px] font-semibold">{{ authStore.currentUser.name }}</div>
              <div class="text-[11px] text-subtle">{{ authStore.currentUser.title }}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-48">
          <DropdownMenuItem @click="onLogout">
            <LogOut class="size-4" :stroke-width="2" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </aside>
</template>
