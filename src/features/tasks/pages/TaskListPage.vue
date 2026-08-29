<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ChevronDown, Flag, Plus, Rows3, Users as UsersIcon, ListFilter } from '@lucide/vue'
import {
  createTask,
  fetchAllProjectTasks,
  fetchSubtaskCount,
  fetchTagsByProjectKey,
  fetchTaskById,
  fetchTasks,
  updateTask,
  updateTaskStatus,
} from '@/api/tasks'
import { fetchProjectByKey } from '@/api/projects'
import { fetchProjectUsers } from '@/api/users'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import TaskAssigneePicker from '@/features/tasks/components/TaskAssigneePicker.vue'
import TaskFilterMenu from '@/features/tasks/components/TaskFilterMenu.vue'
import TaskGanttChart from '@/features/tasks/components/TaskGanttChart.vue'
import TaskRow from '@/features/tasks/components/TaskRow.vue'
import { PRIORITY_LABEL, PRIORITY_ORDER, PRIORITY_TEXT_CLASS, STATUS_DOT_CLASS, STATUS_LABEL, STATUS_ORDER } from '@/lib/constants'
import type { Task, TaskPriority, TaskStatus, User } from '@/mock/types'

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

const { data: users } = useQuery({
  queryKey: ['project-users', projectKey],
  queryFn: () => fetchProjectUsers(projectKey.value),
})

const { data: tags } = useQuery({
  queryKey: ['tags', projectKey],
  queryFn: () => fetchTagsByProjectKey(projectKey.value),
})

const usersById = computed(() => Object.fromEntries((users.value ?? []).map((u) => [u.id, u])))
const tagsById = computed(() => Object.fromEntries((tags.value ?? []).map((t) => [t.id, t])))
const memberUsers = computed(() =>
  (project.value?.memberIds ?? []).map((id) => usersById.value[id]).filter((u): u is User => !!u),
)

// ── URL 쿼리 파생 상태 (필터·그룹·페이지는 전부 route.query에 둔다) ──

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',')
}

const searchTerm = computed(() => ((route.query.q as string) ?? '').trim())
const statusFilter = computed(() => parseCsv(route.query.status) as TaskStatus[])
const priorityFilter = computed(() => parseCsv(route.query.priority) as TaskPriority[])
const assigneeFilter = computed(() => parseCsv(route.query.assignee))
const groupBy = computed<'status' | 'assignee' | 'none'>(() => {
  const g = route.query.group
  return g === 'assignee' || g === 'none' ? g : 'status'
})
const isGanttView = computed(() => route.query.view === 'gantt')
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))

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

// ── 업무 목록 조회 (서버 필터·페이지네이션에 위임) ──

const listFilters = computed(() => ({
  status: statusFilter.value,
  assignee: assigneeFilter.value,
  priority: priorityFilter.value,
  q: searchTerm.value || undefined,
}))

const listParams = computed(() => ({ ...listFilters.value, page: currentPage.value, size: PAGE_SIZE }))

const { data: taskPage } = useQuery({
  queryKey: ['tasks', projectKey, 'list', listParams],
  queryFn: () => fetchTasks(projectKey.value, listParams.value),
  enabled: computed(() => !isGanttView.value),
  placeholderData: keepPreviousData,
})

// 간트는 페이지 개념 없이 필터에 걸린 업무 전체를 한 화면에 그린다 — 큰 size로 한 번에 받아온다.
const { data: ganttTasksRaw } = useQuery({
  queryKey: ['tasks', projectKey, 'gantt', listFilters],
  queryFn: () => fetchAllProjectTasks(projectKey.value, listFilters.value),
  enabled: isGanttView,
})

// 헤더의 "전체 N개 · 진행 중 M개"는 필터와 무관한 프로젝트 전체 통계다.
// 전용 통계 엔드포인트가 프로젝트 단건 규모로는 없어, size=1로 목록 엔드포인트의
// total만 가볍게 읽어온다(응답 items는 최대 1건뿐이라 페이로드가 작다).
const { data: totalCount } = useQuery({
  queryKey: ['tasks', projectKey, 'count', 'total'],
  queryFn: () => fetchTasks(projectKey.value, { size: 1 }),
})
const { data: progressCount } = useQuery({
  queryKey: ['tasks', projectKey, 'count', 'progress'],
  queryFn: () => fetchTasks(projectKey.value, { status: ['progress'], size: 1 }),
})

const pageTasks = computed(() => taskPage.value?.items ?? [])

// 계층 표시(↳ 부모코드 / 하위 N)용 — 부모 목록 조회 엔드포인트가 없어 이 페이지에
// 보이는 업무들의 parentId만 모아 개별 조회하고, id 기준으로 코드를 매핑해둔다.
const parentIdsOnPage = computed(() =>
  Array.from(new Set(pageTasks.value.map((t) => t.parentId).filter((id): id is string => !!id))),
)
const { data: parentCodeByParentId } = useQuery({
  queryKey: ['tasks', projectKey, 'parent-codes', parentIdsOnPage],
  queryFn: async () => {
    const entries = await Promise.all(
      parentIdsOnPage.value.map(async (id) => [id, (await fetchTaskById(id))?.code] as const),
    )
    return Object.fromEntries(entries.filter((e): e is [string, string] => !!e[1]))
  },
  enabled: computed(() => parentIdsOnPage.value.length > 0),
})
const parentCodeById = computed(() => {
  const map: Record<string, string> = {}
  for (const t of pageTasks.value) {
    if (t.parentId) {
      const code = parentCodeByParentId.value?.[t.parentId]
      if (code) map[t.id] = code
    }
  }
  return map
})

const taskIdsOnPage = computed(() => pageTasks.value.map((t) => t.id))
const { data: subtaskCountById } = useQuery({
  queryKey: ['tasks', projectKey, 'subtask-counts', taskIdsOnPage],
  queryFn: async () => {
    const entries = await Promise.all(taskIdsOnPage.value.map(async (id) => [id, await fetchSubtaskCount(id)] as const))
    return Object.fromEntries(entries)
  },
  enabled: computed(() => taskIdsOnPage.value.length > 0),
})

// ── 리스트 뷰: 정렬 · 그룹핑 (현재 페이지 안에서만, 화면 전용 가공) ──

function assigneeSortKey(task: Task) {
  const lead = task.assigneeIds[0]
  return lead ? (usersById.value[lead]?.name ?? lead) : '￿'
}

const sortedPageTasks = computed(() => {
  const list = [...pageTasks.value]
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
// 부모가 이 페이지에 없으면(다른 페이지에 있거나 필터로 제외됨) 해당 업무는 그냥 최상위로 표시한다.
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

const noneTreeOrder = computed(() => (groupBy.value === 'none' ? buildTreeOrder(sortedPageTasks.value) : []))
const depthById = computed(() => {
  const map: Record<string, number> = {}
  for (const { task, depth } of noneTreeOrder.value) map[task.id] = depth
  return map
})
const orderedTasks = computed(() => (groupBy.value === 'none' ? noneTreeOrder.value.map((x) => x.task) : sortedPageTasks.value))

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
    return orderedTasks.value.length ? [{ key: 'all', label: '', tasks: orderedTasks.value }] : []
  }
  const groups: DisplayGroup[] = []
  for (const task of orderedTasks.value) {
    const key = groupBy.value === 'status' ? task.status : (task.assigneeIds[0] ?? '__unassigned__')
    const last = groups.at(-1)
    if (last?.key === key) last.tasks.push(task)
    else groups.push({ key, label: groupLabel(key), dotClass: groupBy.value === 'status' ? STATUS_DOT_CLASS[key as TaskStatus] : undefined, tasks: [task] })
  }
  return groups
})

const totalItems = computed(() => taskPage.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE)))

// ── 간트 뷰: 필터에 걸린 전체 업무를 시작일 재정렬 없이 부모-자식만 인접하게 묶는다 ──

const ganttTasksSorted = computed(() => {
  const list = [...(ganttTasksRaw.value ?? [])]
  list.sort((a, b) => {
    const priorityCompare = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    if (priorityCompare !== 0) return priorityCompare
    return a.endDate.localeCompare(b.endDate)
  })
  return list
})
const ganttOrder = computed(() => buildTreeOrder(ganttTasksSorted.value))
const ganttTasks = computed(() => ganttOrder.value.map((x) => x.task))
const ganttDepthById = computed(() => Object.fromEntries(ganttOrder.value.map((x) => [x.task.id, x.depth])))
const ganttParentCodeById = computed(() => {
  const byId = Object.fromEntries((ganttTasksRaw.value ?? []).map((t) => [t.id, t]))
  const map: Record<string, string> = {}
  for (const t of ganttTasksRaw.value ?? []) {
    if (t.parentId && byId[t.parentId]) map[t.id] = byId[t.parentId].code
  }
  return map
})

// ── 완료 토글 · 간트 드래그 편집 (실제 서버 데이터를 변경) ──

function invalidateTaskQueries() {
  queryClient.invalidateQueries({ queryKey: ['tasks', projectKey.value] })
}

const toggleDoneMutation = useMutation({
  mutationFn: (payload: { taskId: string; status: TaskStatus }) => updateTaskStatus(payload.taskId, payload.status),
  onSuccess: invalidateTaskQueries,
})

function onToggleDone(task: Task) {
  toggleDoneMutation.mutate({ taskId: task.id, status: task.status === 'done' ? 'todo' : 'done' })
}

const updateTaskMutation = useMutation({
  mutationFn: (payload: { taskId: string; patch: Parameters<typeof updateTask>[1] }) =>
    updateTask(payload.taskId, payload.patch),
  onSuccess: invalidateTaskQueries,
})

function onGanttDatesChange(payload: { taskId: string; startDate: string; endDate: string }) {
  updateTaskMutation.mutate({ taskId: payload.taskId, patch: { startDate: payload.startDate, endDate: payload.endDate } })
}

function onGanttProgressChange(payload: { taskId: string; progress: number }) {
  updateTaskMutation.mutate({ taskId: payload.taskId, patch: { progress: payload.progress } })
}

// ── 새 업무 생성 ──

const newTaskOpen = ref(false)
const newTaskTitle = ref('')
const newTaskPriority = ref<TaskPriority>('medium')
const newTaskStartDate = ref('')
const newTaskEndDate = ref('')
const newTaskAssigneeIds = ref<string[]>([])
const newTaskIsPrivate = ref(false)

function openNewTask() {
  newTaskTitle.value = ''
  newTaskPriority.value = 'medium'
  newTaskStartDate.value = ''
  newTaskEndDate.value = ''
  newTaskAssigneeIds.value = []
  newTaskIsPrivate.value = false
  newTaskOpen.value = true
}

const createTaskMutation = useMutation({
  mutationFn: () =>
    createTask(projectKey.value, {
      title: newTaskTitle.value.trim(),
      priority: newTaskPriority.value,
      startDate: newTaskStartDate.value || undefined,
      endDate: newTaskEndDate.value || undefined,
      assigneeIds: newTaskAssigneeIds.value,
      isPrivate: newTaskIsPrivate.value,
    }),
  onSuccess: (task) => {
    invalidateTaskQueries()
    newTaskOpen.value = false
    router.push({ name: 'task-detail', params: { projectKey: projectKey.value, taskId: task.id }, query: route.query })
  },
})

function onCreateTask() {
  if (!newTaskTitle.value.trim()) return
  createTaskMutation.mutate()
}
</script>

<template>
  <div class="relative">
    <div class="mb-4 flex items-start gap-4">
      <div>
        <div class="text-xl font-bold tracking-tight">업무 목록</div>
        <div class="mt-0.5 text-sm text-muted-foreground">
          {{ project?.name }} · 전체 {{ totalCount?.total ?? 0 }}개 업무 · 진행 중 {{ progressCount?.total ?? 0 }}개
        </div>
      </div>
      <div class="ml-auto">
        <Button @click="openNewTask">
          <Plus class="size-[15px]" :stroke-width="2" />
          새 업무
        </Button>
      </div>
    </div>

    <Dialog v-model:open="newTaskOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 업무</DialogTitle>
        </DialogHeader>
        <form class="flex flex-col gap-3" @submit.prevent="onCreateTask">
          <Input v-model="newTaskTitle" placeholder="업무 제목" autofocus />

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold tracking-wide text-subtle uppercase">우선순위</label>
              <Select v-model="newTaskPriority">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in PRIORITY_ORDER" :key="p" :value="p">{{ PRIORITY_LABEL[p] }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label class="mt-6 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <input v-model="newTaskIsPrivate" type="checkbox" class="size-4 accent-primary" />
              비공개 업무
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold tracking-wide text-subtle uppercase">시작일</label>
              <input
                v-model="newTaskStartDate"
                type="date"
                class="h-9 w-full rounded-[9px] border border-border-strong bg-card px-2.5 text-[13px] outline-none focus:border-primary"
              >
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold tracking-wide text-subtle uppercase">마감일</label>
              <input
                v-model="newTaskEndDate"
                type="date"
                class="h-9 w-full rounded-[9px] border border-border-strong bg-card px-2.5 text-[13px] outline-none focus:border-primary"
              >
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-semibold tracking-wide text-subtle uppercase">담당자</label>
            <TaskAssigneePicker :options="memberUsers" v-model="newTaskAssigneeIds" />
          </div>

          <DialogFooter class="mt-1">
            <Button type="button" variant="outline" @click="newTaskOpen = false">취소</Button>
            <Button type="submit" :disabled="!newTaskTitle.trim() || createTaskMutation.isPending.value">만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <div class="mb-3.5 flex flex-wrap items-center gap-2">
      <TaskFilterMenu label="상태" :icon="ListFilter" :options="statusOptions" :selected="statusFilter" @update:selected="setStatusFilter" />
      <TaskFilterMenu label="담당자" :icon="UsersIcon" :options="assigneeOptions" :selected="assigneeFilter" @update:selected="setAssigneeFilter" />
      <TaskFilterMenu label="우선순위" :icon="Flag" :options="priorityOptions" :selected="priorityFilter" @update:selected="setPriorityFilter" />

      <div v-if="!isGanttView" class="ml-auto">
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

    <div v-if="isGanttView ? !ganttTasks.length : !orderedTasks.length" class="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
      조건에 맞는 업무가 없습니다.
    </div>

    <TaskGanttChart
      v-else-if="isGanttView"
      :project-key="projectKey"
      :tasks="ganttTasks"
      :users-by-id="usersById"
      :query="route.query"
      :depth-by-id="ganttDepthById"
      :parent-code-by-id="ganttParentCodeById"
      @update-dates="onGanttDatesChange"
      @update-progress="onGanttProgressChange"
    />

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
            :subtask-count="subtaskCountById?.[task.id]"
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
