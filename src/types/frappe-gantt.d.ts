// frappe-gantt은 자체 타입 선언을 제공하지 않아, 이 프로젝트에서 사용하는
// 최소 API 표면만 선언한다.
declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string
    custom_class?: string
  }

  // frappe-gantt 옵션은 종류가 매우 많고 대부분 선택적이라, 사용하는 항목만
  // 좁혀 선언하기보다 열린 형태로 둔다.
  export type GanttOptions = Record<string, unknown>

  export default class Gantt {
    constructor(wrapper: string | HTMLElement | SVGElement, tasks: GanttTask[], options?: GanttOptions)
    refresh(tasks: GanttTask[]): void
    // 공식 타입은 아니지만 런타임에 존재하는 공개 필드들
    $container: HTMLElement // 스크롤 위치가 담긴 내부 컨테이너
    $popup_wrapper: HTMLElement // 툴팁(팝업) DOM
  }
}
