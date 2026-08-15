import { reactive } from 'vue'

interface ConfirmOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
  resolve: ((value: boolean) => void) | null
}

// 앱 전역에서 하나만 존재하는 확인 다이얼로그 상태.
// Sidebar / 전체 프로젝트 홈 등 서로 다른 컴포넌트 트리에서 공용으로 띄워야 해서 모듈 싱글턴으로 둔다.
const state = reactive<ConfirmState>({
  open: false,
  title: undefined,
  description: '',
  confirmLabel: '확인',
  cancelLabel: '취소',
  destructive: false,
  resolve: null,
})

export function useConfirmDialogState() {
  return state
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    state.open = true
    state.title = options.title
    state.description = options.description
    state.confirmLabel = options.confirmLabel ?? '확인'
    state.cancelLabel = options.cancelLabel ?? '취소'
    state.destructive = options.destructive ?? false
    state.resolve = resolve
  })
}

export function resolveConfirm(value: boolean) {
  state.open = false
  state.resolve?.(value)
  state.resolve = null
}
