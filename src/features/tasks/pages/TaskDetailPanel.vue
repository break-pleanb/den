<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Equal,
  Lock,
  LockOpen,
  MessageSquare,
  TriangleAlert,
  X,
} from '@lucide/vue'
import {
  addComment,
  createSubtask,
  fetchCommentsByTaskId,
  fetchTagsByProjectKey,
  fetchTaskById,
  fetchTasksByProjectKey,
  fetchUsers,
  updateTask,
  updateTaskAssignees,
  updateTaskDependencies,
  updateTaskStatus,
  type TaskPatch,
} from '@/mock/api'
import { fetchProjectByKey } from '@/api/projects'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TaskAssigneePicker from '@/features/tasks/components/TaskAssigneePicker.vue'
import TaskCommentSection from '@/features/tasks/components/TaskCommentSection.vue'
import TaskDependencySection from '@/features/tasks/components/TaskDependencySection.vue'
import TaskSubtaskSection from '@/features/tasks/components/TaskSubtaskSection.vue'
import { wouldCreateCycle } from '@/lib/dependencyGraph'
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  PRIORITY_TEXT_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_DOT_CLASS,
  STATUS_LABEL,
  STATUS_ORDER,
} from '@/lib/constants'
import type { Task, TaskPriority, TaskStatus, User } from '@/mock/types'

const props = defineProps<{ projectKey: string; taskId: string }>()
const projectKey = computed(() => props.projectKey)
const taskId = computed(() => props.taskId)

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()

const PRIORITY_ICON = {
  urgent: TriangleAlert,
  high: ChevronUp,
  medium: Equal,
  low: ChevronDown,
} as const satisfies Record<TaskPriority, unknown>

// ── 조회 ──────────────────────────────────────────────────

const { data: task, isLoading: taskLoading } = useQuery({
  queryKey: ['task', taskId],
  queryFn: () => fetchTaskById(taskId.value),
})

const { data: project } = useQuery({
  queryKey: ['project', projectKey],
  queryFn: () => fetchProjectByKey(projectKey.value),
})

const { data: projectTasks } = useQuery({
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

const { data: comments } = useQuery({
  queryKey: ['comments', taskId],
  queryFn: () => fetchCommentsByTaskId(taskId.value),
})

const usersById = computed(() => Object.fromEntries((users.value ?? []).map((u) => [u.id, u])))
const tagsById = computed(() => Object.fromEntries((tags.value ?? []).map((t) => [t.id, t])))

const assigneeOptions = computed(() =>
  (project.value?.memberIds ?? []).map((id) => usersById.value[id]).filter((u): u is User => !!u),
)

const parentTask = computed(() => (projectTasks.value ?? []).find((t) => t.id === task.value?.parentId))
const subtasks = computed(() => (projectTasks.value ?? []).filter((t) => t.parentId === task.value?.id))
const dependencyTasks = computed(() =>
  (projectTasks.value ?? []).filter((t) => task.value?.dependencyIds.includes(t.id)),
)
const dependencyOptions = computed(() => (projectTasks.value ?? []).filter((t) => t.id !== task.value?.id))
const dependencyBlockedIds = computed(() => {
  const blocked = new Set<string>()
  if (!task.value) return blocked
  for (const option of dependencyOptions.value) {
    if (!task.value.dependencyIds.includes(option.id) && wouldCreateCycle(projectTasks.value ?? [], task.value.id, option.id)) {
      blocked.add(option.id)
    }
  }
  return blocked
})
const taskTags = computed(() =>
  (task.value?.tagIds ?? []).map((id) => tagsById.value[id]).filter((t): t is NonNullable<typeof t> => !!t),
)
const dateOrderInvalid = computed(() => !!task.value && task.value.startDate > task.value.endDate)

// ── 변경 (목업 데이터를 실제로 갱신) ──────────────────────────

function invalidateTask() {
  queryClient.invalidateQueries({ queryKey: ['task', taskId.value] })
  queryClient.invalidateQueries({ queryKey: ['tasks', projectKey.value] })
}

const updateTaskMutation = useMutation({
  mutationFn: (patch: TaskPatch) => updateTask(taskId.value, patch),
  onSuccess: invalidateTask,
})

const updateStatusMutation = useMutation({
  mutationFn: (status: TaskStatus) => updateTaskStatus(taskId.value, status),
  onSuccess: invalidateTask,
})

const updateAssigneesMutation = useMutation({
  mutationFn: (ids: string[]) => updateTaskAssignees(taskId.value, ids),
  onSuccess: invalidateTask,
})

const updateDependenciesMutation = useMutation({
  mutationFn: (ids: string[]) => updateTaskDependencies(taskId.value, ids),
  onSuccess: invalidateTask,
})

// 하위 업무를 만들면 담당자·기간을 바로 지정할 수 있도록 그 상세로 이동한다
const createSubtaskMutation = useMutation({
  mutationFn: (title: string) => createSubtask(taskId.value, title),
  onSuccess: (newTask) => {
    invalidateTask()
    router.push({ name: 'task-detail', params: { projectKey: projectKey.value, taskId: newTask.id }, query: route.query })
  },
})

const toggleSubtaskMutation = useMutation({
  mutationFn: (payload: { id: string; status: TaskStatus }) => updateTaskStatus(payload.id, payload.status),
  onSuccess: invalidateTask,
})

const addCommentMutation = useMutation({
  mutationFn: (payload: { body: string; mentionUserIds: string[] }) =>
    addComment(taskId.value, payload.body, payload.mentionUserIds),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['comments', taskId.value] })
    invalidateTask()
  },
})

// ── 제목 인라인 편집 ──────────────────────────────────────

const editingTitle = ref(false)
const titleDraft = ref('')
const titleInputRef = ref<HTMLInputElement>()

watch(
  task,
  (t) => {
    if (t && !editingTitle.value) titleDraft.value = t.title
  },
  { immediate: true },
)

function startEditTitle() {
  if (!task.value) return
  titleDraft.value = task.value.title
  editingTitle.value = true
  nextTick(() => titleInputRef.value?.focus())
}

function saveTitle() {
  editingTitle.value = false
  const trimmed = titleDraft.value.trim()
  if (!task.value || !trimmed || trimmed === task.value.title) return
  updateTaskMutation.mutate({ title: trimmed })
}

// ── 상태 · 우선순위 · 기간 · 진행률 인라인 편집 ──────────────

function onStatusSelect(value: string) {
  updateStatusMutation.mutate(value as TaskStatus)
}

function onPrioritySelect(value: string) {
  updateTaskMutation.mutate({ priority: value as TaskPriority })
}

function onDateChange(field: 'startDate' | 'endDate', e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (!value) return
  updateTaskMutation.mutate({ [field]: value } as TaskPatch)
}

function onProgressChange(e: Event) {
  const value = Number((e.target as HTMLInputElement).value)
  updateTaskMutation.mutate({ progress: value })
}

function togglePrivate() {
  if (!task.value) return
  updateTaskMutation.mutate({ isPrivate: !task.value.isPrivate })
}

// ── 담당자 · 의존성 · 하위업무 · 댓글 ─────────────────────────

function onUpdateAssignees(ids: string[]) {
  updateAssigneesMutation.mutate(ids)
}

function onUpdateDependencies(ids: string[]) {
  updateDependenciesMutation.mutate(ids)
}

function onToggleSubtaskDone(sub: Task) {
  toggleSubtaskMutation.mutate({ id: sub.id, status: sub.status === 'done' ? 'todo' : 'done' })
}

function onAddSubtask(title: string) {
  createSubtaskMutation.mutate(title)
}

function onSubmitComment(payload: { body: string; mentionUserIds: string[] }) {
  addCommentMutation.mutate(payload)
}

// ── 닫기 ──────────────────────────────────────────────────

// 닫기는 push가 아닌 replace — 열기(push)와 짝을 이뤄 히스토리를 쌓지 않는다.
// 상세를 여러 번 여닫아도 뒤로가기 한 번이면 목록으로 돌아간다.
function close() {
  router.replace({ name: 'tasks', params: { projectKey: props.projectKey }, query: route.query })
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="fixed inset-0 z-40 flex justify-end bg-black/20" @click.self="close">
    <div class="flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-card">
      <div class="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div class="min-w-0">
          <router-link
            v-if="parentTask"
            :to="{ name: 'task-detail', params: { projectKey, taskId: parentTask.id }, query: route.query }"
            class="mb-1 inline-flex items-center gap-1 text-xs font-medium text-subtle hover:text-primary"
          >
            <CornerDownRight class="size-3" :stroke-width="2.2" />
            {{ parentTask.code }} · {{ parentTask.title }}
          </router-link>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-semibold text-muted-foreground">{{ task?.code }}</span>
            <button
              v-if="task"
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              :class="task.isPrivate ? 'bg-secondary text-foreground' : 'text-subtle hover:bg-secondary'"
              @click="togglePrivate"
            >
              <Lock v-if="task.isPrivate" class="size-3" :stroke-width="2.4" />
              <LockOpen v-else class="size-3" :stroke-width="2.4" />
              {{ task.isPrivate ? '비공개' : '공개' }}
            </button>
          </div>
        </div>
        <button type="button" class="shrink-0 text-muted-foreground hover:text-foreground" aria-label="닫기" @click="close">
          <X class="size-4.5" />
        </button>
      </div>

      <div v-if="task" class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <!-- 제목 -->
        <input
          v-if="editingTitle"
          ref="titleInputRef"
          v-model="titleDraft"
          type="text"
          class="w-full rounded-[9px] border border-primary bg-card px-2 py-1 text-lg font-bold tracking-tight outline-none"
          @blur="saveTitle"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
          @keydown.escape="editingTitle = false"
        >
        <div
          v-else
          class="cursor-text rounded-[9px] px-2 py-1 -mx-2 text-lg font-bold tracking-tight hover:bg-background"
          @click="startEditTitle"
        >
          {{ task.title }}
        </div>

        <!-- 상태 · 우선순위 -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button type="button" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" :class="STATUS_BADGE_CLASS[task.status]">
                <span class="size-[6px] rounded-full" :class="STATUS_DOT_CLASS[task.status]" />
                {{ STATUS_LABEL[task.status] }}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-36">
              <DropdownMenuRadioGroup :model-value="task.status" @update:model-value="(v) => onStatusSelect(String(v))">
                <DropdownMenuRadioItem v-for="s in STATUS_ORDER" :key="s" :value="s">
                  <span class="flex items-center gap-2">
                    <span class="size-[6px] rounded-full" :class="STATUS_DOT_CLASS[s]" />
                    {{ STATUS_LABEL[s] }}
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-2.5 py-1 text-xs font-semibold"
                :class="PRIORITY_TEXT_CLASS[task.priority]"
              >
                <component :is="PRIORITY_ICON[task.priority]" class="size-3.5" :stroke-width="2.2" />
                {{ PRIORITY_LABEL[task.priority] }}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-36">
              <DropdownMenuRadioGroup :model-value="task.priority" @update:model-value="(v) => onPrioritySelect(String(v))">
                <DropdownMenuRadioItem v-for="p in PRIORITY_ORDER" :key="p" :value="p">
                  <span class="flex items-center gap-2" :class="PRIORITY_TEXT_CLASS[p]">
                    <component :is="PRIORITY_ICON[p]" class="size-3.5" :stroke-width="2.2" />
                    {{ PRIORITY_LABEL[p] }}
                  </span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <span v-for="tag in taskTags" :key="tag.id" class="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {{ tag.name }}
          </span>
        </div>

        <!-- 담당자 -->
        <section class="mt-5">
          <h3 class="mb-2 text-xs font-semibold tracking-wide text-subtle uppercase">담당자</h3>
          <TaskAssigneePicker :options="assigneeOptions" :model-value="task.assigneeIds" @update:model-value="onUpdateAssignees" />
        </section>

        <!-- 기간 · 진행률 -->
        <section class="mt-5 grid grid-cols-2 gap-4">
          <div>
            <h3 class="mb-2 text-xs font-semibold tracking-wide text-subtle uppercase">시작일</h3>
            <input
              type="date"
              :value="task.startDate"
              class="h-9 w-full rounded-[9px] border border-border-strong bg-card px-2.5 text-[13px] outline-none focus:border-primary"
              @change="onDateChange('startDate', $event)"
            >
          </div>
          <div>
            <h3 class="mb-2 text-xs font-semibold tracking-wide text-subtle uppercase">마감일</h3>
            <input
              type="date"
              :value="task.endDate"
              class="h-9 w-full rounded-[9px] border border-border-strong bg-card px-2.5 text-[13px] outline-none focus:border-primary"
              @change="onDateChange('endDate', $event)"
            >
          </div>
          <p v-if="dateOrderInvalid" class="col-span-2 -mt-1 text-xs font-medium text-destructive">
            시작일이 마감일보다 늦습니다.
          </p>
        </section>

        <section class="mt-5">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="text-xs font-semibold tracking-wide text-subtle uppercase">진행률</h3>
            <span class="text-xs font-semibold text-muted-foreground">{{ task.progress }}%</span>
          </div>
          <div class="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              :value="task.progress"
              class="h-1.5 w-full grow cursor-pointer appearance-none rounded-full bg-[#eef0f3] accent-primary"
              @change="onProgressChange"
            >
          </div>
        </section>

        <!-- 하위업무 -->
        <section class="mt-6">
          <h3 class="mb-2 text-xs font-semibold tracking-wide text-subtle uppercase">
            하위 업무 <span v-if="subtasks.length" class="text-subtle normal-case">· {{ subtasks.length }}개</span>
          </h3>
          <TaskSubtaskSection
            :project-key="projectKey"
            :subtasks="subtasks"
            :query="route.query"
            @toggle-done="onToggleSubtaskDone"
            @add="onAddSubtask"
          />
        </section>

        <!-- 의존성 -->
        <section class="mt-6">
          <h3 class="mb-2 text-xs font-semibold tracking-wide text-subtle uppercase">선행 업무 (의존성)</h3>
          <TaskDependencySection
            :project-key="projectKey"
            :current-status="task.status"
            :dependencies="dependencyTasks"
            :options="dependencyOptions"
            :selected-ids="task.dependencyIds"
            :blocked-ids="dependencyBlockedIds"
            :query="route.query"
            @update:selected-ids="onUpdateDependencies"
          />
        </section>

        <!-- 댓글 -->
        <section class="mt-6 border-t border-border pt-5">
          <h3 class="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-subtle uppercase">
            <MessageSquare class="size-3.5" :stroke-width="2.2" />
            댓글 <span v-if="comments?.length" class="text-subtle normal-case">· {{ comments.length }}개</span>
          </h3>
          <TaskCommentSection
            :comments="comments ?? []"
            :users-by-id="usersById"
            :mention-options="assigneeOptions"
            @submit="onSubmitComment"
          />
        </section>
      </div>

      <div v-else-if="!taskLoading" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        업무를 찾을 수 없습니다.
      </div>
    </div>
  </div>
</template>
