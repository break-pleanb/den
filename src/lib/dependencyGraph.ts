import type { Task } from '@/mock/types'

// fromId에서 출발해 "선행 업무 → 후행 업무" 방향으로 그래프를 타고 갔을 때
// toId에 도달할 수 있는지 검사한다 (toId가 fromId의 다운스트림인지)
function isDownstream(tasks: Task[], fromId: string, toId: string): boolean {
  const visited = new Set<string>()
  const queue = [fromId]
  while (queue.length) {
    const current = queue.shift()!
    if (current === toId) return true
    if (visited.has(current)) continue
    visited.add(current)
    for (const t of tasks) {
      if (t.dependencyIds.includes(current)) queue.push(t.id)
    }
  }
  return false
}

// candidateId를 taskId의 선행 업무로 추가할 때 순환 참조가 발생하는지 검사한다
export function wouldCreateCycle(tasks: Task[], taskId: string, candidateId: string): boolean {
  if (taskId === candidateId) return true
  return isDownstream(tasks, taskId, candidateId)
}
