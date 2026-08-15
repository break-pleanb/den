<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ChevronDown, Flag, Rows3, Users as UsersIcon, ListFilter } from '@lucide/vue'
import { fetchProjectByKey, fetchTagsByProjectKey, fetchTasksByProjectKey, fetchUsers, updateTaskStatus } from '@/mock/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TaskFilterMenu from '@/features/tasks/components/TaskFilterMenu.vue'
import TaskRow from '@/features/tasks/components/TaskRow.vue'
import { PRIORITY_LABEL, PRIORITY_ORDER, PRIORITY_TEXT_CLASS, STATUS_DOT_CLASS, STATUS_LABEL, STATUS_ORDER } from '@/lib/constants'
import type { Task, TaskPriority, TaskStatus } from '@/mock/types'

const props = defineProps<{ projectKey: string }>()
const projectKey = computed(() => props.projectKey)
const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const PAGE_SIZE = 8

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: tasks } = useQuery({
  queryKey: ['tasks', projectKey],
  queryFn: () => fetchTasksByProjectKey(projectKey.value),
})

const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})

const { data: tags } = useQuery({
  queryKey: ['tags', projectKey],
  queryFn: () => fetchTagsByProjectKey(projectKey.value),
})

const usersById = computed(() => Object.fromEntries((users.value ?? []).map((u) => [u.id, u])))
const tagsById = computed(() => Object.fromEntries((tags.value ?? []).map((t) => [t.id, t])))
const taskById = computed(() => Object.fromEntries((tasks.value ?? []).map((t) => [t.id, t])))

// 계층 표시용 — 필터와 무관하게 전체 업무 기준으로 계산한다
const parentCodeById = computed(() => {
  const map: Record<string, string> = {}
  for (const t of tasks.value ?? []) {
    if (t.parentId) {
      const parent = taskById.value[t.parentId]
      if (parent) map[t.id] = parent.code
    }
  }
  return map
})

const subtaskCountById = computed(() => {
  const map: Record<string, number> = {}
  for (const t of tasks.value ?? []) {
    if (t.parentId) map[t.parentId] = (map[t.parentId] ?? 0) + 1
  }
  return map
})

const countByStatus = computed(() => {
  const counts = { todo: 0, progress: 0, review: 0, done: 0 }
  for (const task of tasks.value ?? []) counts[task.status]++
  return counts
})

// ── URL 쿼리 파생 상태 (필터·그룹·페이지는 전부 route.query에 둔다) ──

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',')
}

const searchTerm = computed(() => ((route.query.q as string) ?? '').trim().toLowerCase())
const statusFilter = computed(() => parseCsv(route.query.status) as TaskStatus[])
const priorityFilter = computed(() => parseCsv(route.query.priority) as TaskPriority[])
const assigneeFilter = computed(() => parseCsv(route.query.assignee))
const groupBy = computed<'status' | 'assignee' | 'none'>(() => {
  const g = route.query.group
  return g === 'assignee' || g === 'none' ? g : 'status'
})

// 필터·그룹·페이지 변경은 뒤로가기로 직전 상태를 복원할 수 있어야 하므로
// router.replace가 아닌 router.push로 히스토리에 쌓는다 (URL 우선 원칙).
function updateQuery(patch: Record<string, string | undefined>) {
  router.push({ query: { ...route.query, ...patch, page: undefined } })
}

function setStatusFilter(values: string[]) {
  updateQuery({ status: values.length ? values.join(',') : undefined })
}
function setPriorityFilter(values: string[]) {
  updateQuery({ priority: values.length ? values.join(',') : undefined })
}
function setAssigneeFilter(values: string[]) {
  updateQuery({ assignee: values.length ? values.join(',') : undefined })
}
function setGroupBy(value: string) {
  updateQuery({ group: value === 'status' ? undefined : value })
}
function setPage(page: number) {
  router.push({ query: { ...route.query, page: page <= 1 ? undefined : String(page) } })
}

// ── 그룹 헤더 접기/펼치기 (화면 일시 상태 — 뒤로가기 복원 대상 아님) ──

const collapsedGroups = ref(new Set<string>())

function toggleGroupCollapsed(key: string) {
  const next = new Set(collapsedGroups.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedGroups.value = next
}

// ── 필터 옵션 ──

const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s], dotClass: STATUS_DOT_CLASS[s] }))
const priorityOptions = PRIORITY_ORDER.map((p) => ({
  value: p,
  label: PRIORITY_LABEL[p],
  dotClass: `bg-current ${PRIORITY_TEXT_CLASS[p]}`,
}))
const assigneeOptions = computed(() =>
  (project.value?.memberIds ?? []).map((id) => ({ value: id, label: usersById.value[id]?.name ?? id })),
)

// ── 필터링 · 정렬 · 그룹핑 · 페이지네이션 ──

const filteredTasks = computed(() => {
  let list = tasks.value ?? []
  const term = searchTerm.value
  if (term) list = list.filter((t) => t.title.toLowerCase().includes(term) || t.code.toLowerCase().includes(term))
  if (statusFilter.value.length) list = list.filter((t) => statusFilter.value.includes(t.status))
  if (priorityFilter.value.length) list = list.filter((t) => priorityFilter.value.includes(t.priority))
  if (assigneeFilter.value.length) list = list.filter((t) => t.assigneeIds.some((id) => assigneeFilter.value.includes(id)))
  return list
})

function assigneeSortKey(task: Task) {
  const lead = task.assigneeIds[0]
  return lead ? (usersById.value[lead]?.name ?? lead) : '￿'
}

const sortedTasks = computed(() => {
  const list = [...filteredTasks.value]
  list.sort((a, b) => {
    let groupCompare = 0
    if (groupBy.value === 'status') groupCompare = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    else if (groupBy.value === 'assignee') groupCompare = assigneeSortKey(a).localeCompare(assigneeSortKey(b))
    if (groupCompare !== 0) return groupCompare

    const priorityCompare = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    if (priorityCompare !== 0) return priorityCompare

    return a.endDate.localeCompare(b.endDate)
  })
  return list
})

// 그룹핑 없음(group=none)일 때는 부모 업무 바로 아래 자식 업무를 이어붙여 트리로 보여준다.
// 정렬 순서(우선순위·마감일)는 유지하되, 부모-자식 인접은 트리 구조가 우선한다.
function buildTreeOrder(list: Task[]): { task: Task; depth: number }[] {
  const idsInList = new Set(list.map((t) => t.id))
  const childrenByParent = new Map<string, Task[]>()
  for (const t of list) {
    if (t.parentId && idsInList.has(t.parentId)) {
      if (!childrenByParent.has(t.parentId)) childrenByParent.set(t.parentId, [])
      childrenByParent.get(t.parentId)!.push(t)
    }
  }
  const result: { task: Task; depth: number }[] = []
  function visit(t: Task, depth: number) {
    result.push({ task: t, depth })
    for (const child of childrenByParent.get(t.id) ?? []) visit(child, depth + 1)
  }
  const roots = list.filter((t) => !t.parentId || !idsInList.has(t.parentId))
  for (const root of roots) visit(root, 0)
  return result
}

const noneTreeOrder = computed(() => (groupBy.value === 'none' ? buildTreeOrder(sortedTasks.value) : []))
const depthById = computed(() => {
  const map: Record<string, number> = {}
  for (const { task, depth } of noneTreeOrder.value) map[task.id] = depth
  return map
})
const orderedTasks = computed(() => (groupBy.value === 'none' ? noneTreeOrder.value.map((x) => x.task) : sortedTasks.value))

const totalItems = computed(() => filteredTasks.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE)))
const currentPage = computed(() => Math.min(Math.max(1, Number(route.query.page) || 1), totalPages.value))

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return orderedTasks.value.slice(start, start + PAGE_SIZE)
})

interface DisplayGroup {
  key: string
  label: string
  dotClass?: string
  tasks: Task[]
}

function groupLabel(key: string): string {
  if (groupBy.value === 'status') return STATUS_LABEL[key as TaskStatus]
  if (key === '__unassigned__') return '미배정'
  return usersById.value[key]?.name ?? '알 수 없음'
}

const displayGroups = computed<DisplayGroup[]>(() => {
  if (groupBy.value === 'none') {
    return pagedTasks.value.length ? [{ key: 'all', label: '', tasks: pagedTasks.value }] : []
  }
  const groups: DisplayGroup[] = []
  for (const task of pagedTasks.value) {
    const key = groupBy.value === 'status' ? task.status : (task.assigneeIds[0] ?? '__unassigned__')
    const last = groups.at(-1)
    if (last?.key === key) last.tasks.push(task)
    else groups.push({ key, label: groupLabel(key), dotClass: groupBy.value === 'status' ? STATUS_DOT_CLASS[key as TaskStatus] : undefined, tasks: [task] })
  }
  return groups
})

// ── 완료 토글 (목업 데이터를 실제로 변경) ──

const toggleDoneMutation = useMutation({
  mutationFn: (payload: { taskId: string; status: TaskStatus }) => updateTaskStatus(payload.taskId, payload.status),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks', projectKey.value] }),
})

function onToggleDone(task: Task) {
  toggleDoneMutation.mutate({ taskId: task.id, status: task.status === 'done' ? 'todo' : 'done' })
}
</script>

<template>
  <div class="relative">
    <div class="mb-4">
      <div class="text-xl font-bold tracking-tight">업무 목록</div>
      <div class="mt-0.5 text-sm text-muted-foreground">
        {{ project?.name }} · 전체 {{ tasks?.length ?? 0 }}개 업무 · 진행 중 {{ countByStatus.progress }}개
      </div>
    </div>

    <div class="mb-3.5 flex flex-wrap items-center gap-2">
      <TaskFilterMenu label="상태" :icon="ListFilter" :options="statusOptions" :selected="statusFilter" @update:selected="setStatusFilter" />
      <TaskFilterMenu label="담당자" :icon="UsersIcon" :options="assigneeOptions" :selected="assigneeFilter" @update:selected="setAssigneeFilter" />
      <TaskFilterMenu label="우선순위" :icon="Flag" :options="priorityOptions" :selected="priorityFilter" @update:selected="setPriorityFilter" />

      <div class="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-[9px] border border-border-strong bg-card px-3 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-background"
            >
              <Rows3 class="size-3.5" :stroke-width="2" />
              그룹: {{ groupBy === 'status' ? '상태' : groupBy === 'assignee' ? '담당자' : '없음' }}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuRadioGroup :model-value="groupBy" @update:model-value="(v) => setGroupBy(String(v))">
              <DropdownMenuRadioItem value="status">상태</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="assignee">담당자</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="none">없음</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <div v-if="!filteredTasks.length" class="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
      조건에 맞는 업무가 없습니다.
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <div
        class="grid grid-cols-[26px_minmax(220px,2.4fr)_108px_96px_140px_120px_80px] items-center gap-3 border-b border-border bg-[#fcfcfd] px-[18px] py-2.5 text-[11.5px] font-semibold tracking-wide text-subtle uppercase"
      >
        <div></div>
        <div>업무</div>
        <div>상태</div>
        <div>우선순위</div>
        <div>담당자</div>
        <div>진행률</div>
        <div>마감</div>
      </div>

      <template v-for="group in displayGroups" :key="group.key">
        <button
          v-if="groupBy !== 'none'"
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 border-b border-border bg-[#fbfbfc] px-[18px] py-2.5 text-left text-xs font-semibold text-muted-foreground hover:bg-[#f4f5f7]"
          @click="toggleGroupCollapsed(group.key)"
        >
          <ChevronDown
            class="size-3.5 shrink-0 text-subtle transition-transform"
            :class="{ '-rotate-90': collapsedGroups.has(group.key) }"
            :stroke-width="2.4"
          />
          <span v-if="group.dotClass" class="size-2 rounded-[2px]" :class="group.dotClass" />
          {{ group.label }}
          <span class="rounded-full bg-[#eef0f3] px-2 py-px text-[11px] font-semibold text-subtle">{{ group.tasks.length }}</span>
        </button>
        <template v-if="groupBy === 'none' || !collapsedGroups.has(group.key)">
          <TaskRow
            v-for="task in group.tasks"
            :key="task.id"
            :project-key="projectKey"
            :task="task"
            :assignees="task.assigneeIds.map((id) => usersById[id]).filter((u): u is NonNullable<typeof u> => !!u)"
            :tag="tagsById[task.tagIds[0] ?? '']"
            :query="route.query"
            :parent-code="groupBy === 'none' ? undefined : parentCodeById[task.id]"
            :subtask-count="subtaskCountById[task.id]"
            :depth="depthById[task.id] ?? 0"
            @toggle-done="onToggleDone(task)"
          />
        </template>
      </template>

      <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-border px-[18px] py-3">
        <div class="text-xs text-muted-foreground">
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, totalItems) }} / 전체 {{ totalItems }}개
        </div>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded-[7px] px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="currentPage === 1"
            @click="setPage(currentPage - 1)"
          >
            이전
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            class="grid size-7 place-items-center rounded-[7px] text-xs font-semibold"
            :class="p === currentPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background'"
            @click="setPage(p)"
          >
            {{ p }}
          </button>
          <button
            type="button"
            class="rounded-[7px] px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent"
            :disabled="currentPage === totalPages"
            @click="setPage(currentPage + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </div>

    <router-view />
  </div>
</template>
