<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, type LocationQueryRaw } from 'vue-router'
import Gantt from 'frappe-gantt'
import 'frappe-gantt/dist/frappe-gantt.css'
import { formatISODate, formatMonthDay } from '@/lib/date'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/lib/constants'
import type { Task, TaskStatus, User } from '@/mock/types'

const props = defineProps<{
  projectKey: string
  tasks: Task[]
  usersById: Record<string, User>
  query: LocationQueryRaw
  depthById: Record<string, number>
  parentCodeById: Record<string, string>
}>()

const emit = defineEmits<{
  'update-dates': [{ taskId: string; startDate: string; endDate: string }]
  'update-progress': [{ taskId: string; progress: number }]
}>()

const router = useRouter()
const container = ref<HTMLElement | null>(null)
let chart: Gantt | null = null
let popupObserver: MutationObserver | null = null
let onWheel: ((e: WheelEvent) => void) | null = null

// depth 0(최상위)과 depth>0(하위 업무)를 서로 다른 단일 토큰 클래스로 나눠 둔다.
// frappe-gantt는 classList.add()에 공백 섞인 문자열을 넘기면 예외를 던지므로
// "상태 gantt-bar-progress" + "하위 -child" 를 별도 클래스로 합성할 수 없다.
const STATUS_BAR_CLASS: Record<TaskStatus, string> = {
  todo: 'gantt-bar-todo',
  progress: 'gantt-bar-progress',
  review: 'gantt-bar-review',
  done: 'gantt-bar-done',
}
const STATUS_BAR_CLASS_CHILD: Record<TaskStatus, string> = {
  todo: 'gantt-bar-todo-child',
  progress: 'gantt-bar-progress-child',
  review: 'gantt-bar-review-child',
  done: 'gantt-bar-done-child',
}

function assigneeNames(task: Task): string {
  const names = task.assigneeIds.map((id) => props.usersById[id]?.name).filter((n): n is string => !!n)
  return names.length ? names.join(', ') : '미배정'
}

// 리스트 뷰(그룹 없음)와 동일하게 "↳ 부모코드"를 라벨 앞에 붙이고,
// 깊이만큼 전각 공백을 더해 계층을 드러낸다. 막대는 SVG 텍스트라 CSS 들여쓰기를 못 쓴다.
// 막대 자체의 점선 테두리·라벨 색(.den-gantt [class*="-child"] 규칙)과 함께 계층을 표시한다.
function taskLabel(t: Task): string {
  const depth = props.depthById[t.id] ?? 0
  const indent = '　'.repeat(depth)
  const parentCode = props.parentCodeById[t.id]
  const prefix = parentCode ? `↳ ${parentCode}  ` : ''
  return `${indent}${prefix}${t.code}  ${t.title}`
}

function toGanttTasks(tasks: Task[]) {
  const idsInSet = new Set(tasks.map((t) => t.id))
  return tasks.map((t) => {
    const depth = props.depthById[t.id] ?? 0
    return {
      id: t.id,
      name: taskLabel(t),
      start: t.startDate,
      end: t.endDate,
      progress: t.progress,
      dependencies: t.dependencyIds.filter((id) => idsInSet.has(id)).join(','),
      custom_class: depth > 0 ? STATUS_BAR_CLASS_CHILD[t.status] : STATUS_BAR_CLASS[t.status],
    }
  })
}

function findTask(taskId: string): Task | undefined {
  return props.tasks.find((t) => t.id === taskId)
}

// 세로 스크롤은 AppLayout의 `.overflow-y-auto` 본문 컨테이너가 담당한다 —
// 클래스명에 의존하지 않도록 실제로 세로 스크롤 가능한 첫 조상을 찾는다.
function findVerticalScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node) {
    const style = getComputedStyle(node)
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return null
}

// 팝업이 뷰포트 경계를 벗어나면 앵커 반대편으로 뒤집는다.
// show()가 매번 style.left/top을 (앵커 + 10 / 앵커 - 10)으로 새로 세팅하므로,
// 그 값에서 원래 앵커 좌표를 역산해 반대쪽 좌표를 계산한다.
function repositionPopup() {
  const popup = chart?.$popup_wrapper
  if (!popup || popup.classList.contains('hide')) return

  const originalLeft = parseFloat(popup.style.left || '0')
  const originalTop = parseFloat(popup.style.top || '0')
  const rect = popup.getBoundingClientRect()
  const margin = 8

  let left = originalLeft
  let top = originalTop
  if (rect.right > window.innerWidth - margin) left = originalLeft - rect.width - 20
  if (rect.bottom > window.innerHeight - margin) top = originalTop - rect.height
  if (left < margin) left = originalLeft + (margin - rect.left)

  if (left !== originalLeft) popup.style.left = `${left}px`
  if (top !== originalTop) popup.style.top = `${top}px`
}

function renderChart() {
  if (!container.value) return
  const ganttTasks = toGanttTasks(props.tasks)
  if (!ganttTasks.length) {
    chart = null
    container.value.innerHTML = ''
    return
  }

  if (chart) {
    // refresh()는 내부적으로 오늘 위치로 다시 스크롤하므로, 드래그 등으로 데이터가
    // 갱신되어 재렌더링될 때 사용자가 보던 가로·세로 스크롤 위치를 그대로 복원한다.
    // 동기 복원 한 번 + nextTick 복원 한 번을 모두 둬서, 같은 틱에 벌어지는 다른
    // 레이아웃 변화(헤더 텍스트 등)로 인한 재점프까지 덮는다.
    const scrollLeft = chart.$container.scrollLeft
    const vScrollParent = findVerticalScrollParent(container.value)
    const scrollTop = vScrollParent?.scrollTop
    chart.refresh(ganttTasks)
    chart.$container.scrollLeft = scrollLeft
    if (vScrollParent && scrollTop !== undefined) vScrollParent.scrollTop = scrollTop
    nextTick(() => {
      if (!chart) return
      chart.$container.scrollLeft = scrollLeft
      if (vScrollParent && scrollTop !== undefined) vScrollParent.scrollTop = scrollTop
    })
    return
  }

  chart = new Gantt(container.value, ganttTasks, {
    view_mode: 'Day',
    view_modes: ['Day', 'Week', 'Month'],
    view_mode_select: true,
    today_button: true,
    language: 'ko',
    bar_height: 26,
    padding: 20,
    popup_on: 'hover',
    on_click: (ganttTask: { id: string }) => {
      router.push({
        name: 'task-detail',
        params: { projectKey: props.projectKey, taskId: ganttTask.id },
        query: props.query,
      })
    },
    on_date_change: (ganttTask: { id: string }, start: Date, end: Date) => {
      emit('update-dates', { taskId: ganttTask.id, startDate: formatISODate(start), endDate: formatISODate(end) })
    },
    on_progress_change: (ganttTask: { id: string }, progress: number) => {
      emit('update-progress', { taskId: ganttTask.id, progress: Math.round(progress) })
    },
    popup: ({ task, set_title, set_subtitle, set_details }: {
      task: { id: string }
      set_title: (html: string) => void
      set_subtitle: (html: string) => void
      set_details: (html: string) => void
    }) => {
      const source = findTask(task.id)
      if (!source) return
      set_title(`${source.code} · ${source.title}`)
      set_subtitle(`${STATUS_LABEL[source.status]} · 우선순위 ${PRIORITY_LABEL[source.priority]}`)
      set_details(
        `담당자: ${assigneeNames(source)}<br/>${formatMonthDay(source.startDate)} - ${formatMonthDay(source.endDate)} · 진행률 ${source.progress}%`,
      )
    },
  })

  // 휠은 세로 스크롤(페이지)만, 가로 이동은 스크롤바나 Shift+휠로만 — 브라우저가
  // 가로만 스크롤 가능한 요소 위에서 세로 휠을 가로 스크롤로 치환하는 기본 동작을 막는다.
  onWheel = (e: WheelEvent) => {
    if (e.shiftKey) return
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    e.preventDefault()
    const vScrollParent = container.value && findVerticalScrollParent(container.value)
    vScrollParent?.scrollBy({ top: e.deltaY })
  }
  chart.$container.addEventListener('wheel', onWheel, { passive: false })

  // 팝업이 보일 때마다(class="hide" 토글) 뷰포트 경계를 벗어나는지 확인해 위치를 보정한다.
  popupObserver = new MutationObserver(repositionPopup)
  popupObserver.observe(chart.$popup_wrapper, { attributes: true, attributeFilter: ['class'] })
}

onMounted(renderChart)
watch(() => props.tasks, renderChart)

onBeforeUnmount(() => {
  if (chart && onWheel) chart.$container.removeEventListener('wheel', onWheel)
  popupObserver?.disconnect()
  popupObserver = null
  onWheel = null
  chart = null
})
</script>

<template>
  <div class="den-gantt overflow-hidden rounded-lg border border-border bg-card shadow-card">
    <div ref="container"></div>
  </div>
</template>

<style>
/* frappe-gantt은 SVG/DOM을 직접 그리므로 scoped 대신 --g-* 변수를 den 토큰에 매핑해 통일한다 */
.den-gantt {
  --g-arrow-color: var(--subtle);
  --g-tick-color-thick: var(--border-strong);
  --g-tick-color: var(--border);
  --g-actions-background: var(--secondary);
  --g-border-color: var(--border);
  --g-text-muted: var(--muted-foreground);
  --g-text-light: var(--primary-foreground);
  --g-text-dark: var(--foreground);
  --g-progress-color: var(--primary);
  --g-handle-color: var(--primary);
  --g-weekend-label-color: var(--muted);
  --g-expected-progress: var(--primary-soft);
  --g-header-background: var(--card);
  --g-row-color: var(--card);
  --g-row-border-color: var(--border);
  --g-today-highlight: var(--primary);
  --g-popup-actions: var(--secondary);
  --g-weekend-highlight-color: var(--background);
  --g-bar-color: var(--status-todo-bg);
}

.den-gantt .gantt-container {
  border-radius: 0;
}

.den-gantt .bar-wrapper .bar {
  stroke-width: 1.5;
}

/* 진행률 채움색은 업무 리스트(TaskRow)와 동일하게 완료만 상태색, 나머지는 인디고를 쓴다.
   [class*="..."]는 gantt-bar-todo와 그 하위 업무 변형인 gantt-bar-todo-child를 함께 잡는다 —
   frappe-gantt가 한 업무에 클래스 하나만 붙일 수 있어(공백 포함 문자열은 예외 발생) 상태·계층을
   "gantt-bar-{상태}[-child]" 한 토큰으로 합쳐뒀다. */
.den-gantt .bar-wrapper[class*="gantt-bar-todo"] .bar {
  fill: var(--status-todo-bg);
  stroke: var(--status-todo-fg);
}
.den-gantt .bar-wrapper[class*="gantt-bar-todo"] .bar-progress {
  fill: var(--primary);
}

.den-gantt .bar-wrapper[class*="gantt-bar-progress"] .bar {
  fill: var(--status-progress-bg);
  stroke: var(--status-progress-fg);
}
.den-gantt .bar-wrapper[class*="gantt-bar-progress"] .bar-progress {
  fill: var(--primary);
}

.den-gantt .bar-wrapper[class*="gantt-bar-review"] .bar {
  fill: var(--status-review-bg);
  stroke: var(--status-review-fg);
}
.den-gantt .bar-wrapper[class*="gantt-bar-review"] .bar-progress {
  fill: var(--primary);
}

.den-gantt .bar-wrapper[class*="gantt-bar-done"] .bar {
  fill: var(--status-done-bg);
  stroke: var(--status-done-fg);
}
.den-gantt .bar-wrapper[class*="gantt-bar-done"] .bar-progress {
  fill: var(--status-done-fg);
}

/* 하위 업무 막대 — 점선 테두리 + 옅은 이탤릭 라벨로 상위 업무와 구분한다.
   화살표(--g-arrow-color, 실선)와는 형태·용도가 겹치지 않는다. */
.den-gantt .bar-wrapper[class*="-child"] .bar {
  stroke-dasharray: 3 2;
}
.den-gantt .bar-wrapper[class*="-child"] .bar-label {
  fill: var(--muted-foreground);
  font-style: italic;
}

.den-gantt .popup-wrapper {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.den-gantt .side-header .today-button,
.den-gantt .side-header select {
  font-weight: 600;
  color: var(--foreground);
}
</style>
