import type { Tag } from './types'

// 태그는 프로젝트별로 정의됨
export const mockTags: Tag[] = [
  { id: 't-app-design', projectId: 'p-app', name: '디자인' },
  { id: 't-app-dev', projectId: 'p-app', name: '개발' },
  { id: 't-app-bug', projectId: 'p-app', name: '버그' },
  { id: 't-app-qa', projectId: 'p-app', name: 'QA' },

  { id: 't-backend-dev', projectId: 'p-backend', name: '개발' },
  { id: 't-backend-infra', projectId: 'p-backend', name: '인프라' },

  { id: 't-simsec-doc', projectId: 'p-sim-sec', name: '문서' },
  { id: 't-simsec-infra', projectId: 'p-sim-sec', name: '인프라' },
]

export function getTagsByProject(projectId: string): Tag[] {
  return mockTags.filter((t) => t.projectId === projectId)
}
