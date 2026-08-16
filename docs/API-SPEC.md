# den API 명세 (백엔드 구현용)

이 문서는 `src/mock/api.ts`(목업 API 함수)와 `src/mock/types.ts`(데이터 타입)를
기준으로, 프론트가 실제로 기대하는 요청·응답 형태를 정리한 것이다.
백엔드는 이 문서의 시그니처를 계약으로 삼아 구현하고, 프론트는 목업 함수를
동일한 시그니처의 axios 호출로 교체하기만 하면 되도록 맞춘다.

상위 설계 맥락(ERD, 권한 모델, WebSocket 구조)은 `docs/DEN-DESIGN.md` 4~6장 참고.
이 문서는 그중 6장을 실제 함수 시그니처 수준으로 구체화한 버전이다.

---

## 0. 공통 규칙

### 0.1 베이스 URL / 인증
- 베이스 경로: `/api`
- 인증: `Authorization: Bearer <JWT>` (로그인 이후 모든 요청에 필요. `/api/auth/*`, 헬스체크 제외)
- 아래 명세에서 인증 헤더는 생략하고 표기한다.

### 0.2 식별자 규칙 (중요)
- **프로젝트는 URL에 `projectKey`(사람이 읽는 키, 예: `"APP"`)를 쓴다. 내부 UUID를 URL에 노출하지 않는다.**
  아래 `{projectKey}`로 표기한 경로 파라미터는 전부 이 값이다.
- 그 외 리소스(`taskId`, `userId`, `roleId`, `channelId`, `folderId`, `notificationId` 등)는 서버 내부 ID(UUID 문자열)를 그대로 쓴다.
- 목업 데이터의 ID 형식(`t-app-142`, `u-jk` 등)은 목업 전용이며, 실제 백엔드는 UUID를 발급하면 된다. 프론트는 ID 값의 형식에 의존하지 않는다.

### 0.3 응답 형식
- 모든 응답은 별도 래퍼(`{ data: ... }` 등) 없이 **리소스를 그대로** JSON으로 반환한다 (목업 함수의 반환값과 동일).
- 목록 조회는 배열을 그대로 반환한다 (`{ items: [...] }` 형태 아님).
- 대상이 없는 단건 조회/수정(`PATCH /tasks/{id}` 등)은 **404**를 반환한다. 목업 함수가 `T | undefined`를 반환하는 지점이 여기 해당한다.
- 부수효과만 있고 응답 바디가 필요 없는 요청(읽음 처리 등, 목업 함수가 `void` 반환)은 **204 No Content**로 응답한다.
- 날짜: `startDate`/`endDate`/`invitedAt`은 `YYYY-MM-DD`, 그 외 `createdAt` 등은 ISO 8601 datetime 문자열.

### 0.4 권한 체크 (요약 — 상세는 DEN-DESIGN.md 5장)
- 모든 프로젝트 하위 리소스(`/projects/{projectKey}/...`)는 요청자가 해당 프로젝트 멤버인지 서버가 확인한다. 아니면 **404**(존재 자체를 숨김. 403 아님).
- `isPrivate` 업무는 담당자(`assigneeIds`) 또는 참여자(`watcherIds`)가 아니면 목록·상세 모두 **404**.
- 메뉴 권한(업무/간트/메신저)이 꺼진 역할은 해당 하위 리소스 요청 시 **403**.
- 프론트는 숨기기만 할 뿐 최종 판단은 항상 서버가 한다.

### 0.5 이 문서에 없는 것 (목업 전용, 백엔드 구현 대상 아님)
`src/mock/api.ts`의 `addAutoReply`, `simulateBackgroundActivity`는 실시간 메신저를
시연하기 위한 프론트 전용 시뮬레이션이며 실제 API 대응물이 없다. 백엔드는 대신
6.5절의 STOMP 메시지 브로드캐스트로 실시간성을 제공한다.

---

## 1. 인증

### `POST /api/auth/login`
로그인 폼(`LoginPage.vue`)이 기대하는 형태. 목업 단계에서는 항상 고정 사용자(`CURRENT_USER_ID`)로 로그인 처리하므로 실제 검증 로직은 없으나, 실제 구현 시 아래 계약을 따른다.

**Request**
```ts
{ email: string; password: string }
```

**Response** `200`
```ts
{ accessToken: string; user: User }
```
`401` — 이메일/비밀번호 불일치.

### `GET /api/auth/me`
목업 함수: `fetchCurrentUser(): Promise<User>`

**Response** `200` → [`User`](#user)

### `POST /api/auth/refresh`
설계상 자리만 예약 (목업 미구현). 리프레시 토큰으로 액세스 토큰 재발급.

---

## 2. 프로젝트 / 폴더 / 즐겨찾기

### `GET /api/projects`
목업 함수: `fetchProjects(): Promise<Project[]>`
내가 속한 프로젝트 전체.

**Response** `200` → [`Project`](#project)`[]`

### `POST /api/projects`
목업 함수: `createProject(name: string, folderId?: string | null): Promise<Project>`

**Request**
```ts
{ name: string; folderId?: string | null }
```

**Response** `201` → [`Project`](#project)

**비고 (서버 side effect)**: 생성 시 요청자를 위한 관리자 역할(`isAdmin: true`, 모든 메뉴 권한 `true`)을 자동 생성하고 `ProjectMember`로 등록한다. `key`는 서버가 발급하는 고유 슬러그(예: 프로젝트명 기반 또는 순번). `color`는 팔레트에서 순환 할당.

### `GET /api/projects/{projectKey}`
목업 함수: `fetchProjectByKey(key): Promise<Project | undefined>`

**Response** `200` → [`Project`](#project) / `404`

### `GET /api/me/project-roles`
목업 함수: `fetchMyProjectRoles(): Promise<Record<string, Role | undefined>>`
전체 프로젝트 홈 카드의 역할 배지용 — 내가 속한 각 프로젝트에서의 내 역할.

**Response** `200`
```ts
Record<projectId, Role | undefined>
```
> 주의: 이 맵의 키는 `projectId`(내부 ID)다. `GET /api/projects` 응답의 각 `Project.id`와 매칭해서 쓴다.

### 폴더

#### `GET /api/folders`
목업 함수: `fetchFolders(): Promise<Folder[]>` — 요청자 개인 폴더 목록.

**Response** `200` → [`Folder`](#folder)`[]`

#### `POST /api/folders`
목업 함수: `createFolder(name: string): Promise<Folder>`

**Request** `{ name: string }`
**Response** `201` → [`Folder`](#folder)

#### `PATCH /api/projects/{projectKey}/placement`
목업 함수: `moveProjectToFolder(projectId: string, folderId: string | null): Promise<Project | undefined>`
프로젝트를 내 화면에서 다른 폴더로 이동 (개인용 배치이므로 요청자 본인에게만 영향).

**Request** `{ folderId: string | null }` (`null` = 미분류로 이동)
**Response** `200` → [`Project`](#project) / `404`

> 목업 함수는 `projectId`(내부 ID)를 받지만, 프론트 라우팅 관례상 이 엔드포인트는 `{projectKey}`로 통일해도 무방하다 — 실제 구현 시 택1.

### 즐겨찾기

#### `GET /api/favorites`
목업 함수: `fetchFavoriteProjectIds(): Promise<string[]>`

**Response** `200` → `string[]` (즐겨찾기한 `projectId` 목록)

#### `POST /api/projects/{projectKey}/favorite`
목업 함수: `toggleFavoriteProject(projectId: string): Promise<string[]>`
토글(있으면 해제, 없으면 추가).

**Response** `200` → `string[]` (**갱신된 전체 즐겨찾기 `projectId` 목록**을 반환 — 성공 여부만 응답하는 게 아님에 주의)

---

## 3. 사용자 / 멤버 / 권한

### `GET /api/users`
목업 함수: `fetchUsers(): Promise<User[]>` — 전체 사용자 (멘션·담당자 선택용).

**Response** `200` → [`User`](#user)`[]`

### `GET /api/projects/{projectKey}/roles`
목업 함수: `fetchRolesByProjectKey(projectKey): Promise<Role[]>`

**Response** `200` → [`Role`](#role)`[]`

### `GET /api/projects/{projectKey}/members`
목업 함수: `fetchProjectMembers(projectKey): Promise<ProjectMember[]>`

**Response** `200` → [`ProjectMember`](#projectmember)`[]`

### `GET /api/projects/{projectKey}/members/roles`
목업 함수: `fetchProjectMemberRoles(projectKey): Promise<Record<string, Role | undefined>>`
멤버 관리 화면에서 멤버별 현재 역할을 빠르게 조회하기 위한 보조 엔드포인트.

**Response** `200`
```ts
Record<userId, Role | undefined>
```

### `GET /api/projects/{projectKey}/menu-permissions`
목업 함수: `fetchMenuPermissions(projectKey): Promise<Record<MenuKey, boolean>>`
**요청자 본인**의 이 프로젝트 내 메뉴 접근 권한. 컨텍스트 바 탭 표시/숨김에 사용.

**Response** `200`
```ts
Record<'tasks' | 'gantt' | 'messenger', boolean>
```

### `POST /api/projects/{projectKey}/members`
목업 함수: `inviteProjectMember(projectKey, name, email, roleId): Promise<User>`
멤버 초대. 사용자가 처음 초대되면 신규 계정도 함께 생성(목업 동작 기준).

**Request**
```ts
{ name: string; email: string; roleId: string }
```

**Response** `201` → [`User`](#user)

**비고**: 서버는 초대와 동시에 `ProjectMember` 레코드도 생성한다 (`roleId`, `invitedAt`).

### `PATCH /api/projects/{projectKey}/members/{userId}`
목업 함수: `updateProjectMemberRole(projectKey, userId, roleId): Promise<void>`

**Request** `{ roleId: string }`
**Response** `204`

### `DELETE /api/projects/{projectKey}/members/{userId}`
목업 함수: `removeProjectMember(projectKey, userId): Promise<void>`

**Response** `204`

### `PATCH /api/roles/{roleId}/menu-permissions`
목업 함수: `updateRoleMenuPermission(roleId, menuKey, value): Promise<void>`

**Request**
```ts
{ menuKey: 'tasks' | 'gantt' | 'messenger'; value: boolean }
```
**Response** `204`

---

## 4. 업무

### `GET /api/projects/{projectKey}/tasks`
목업 함수: `fetchTasksByProjectKey(projectKey): Promise<Task[]>`
비공개(`isPrivate`) 업무 중 요청자가 담당자/참여자가 아닌 항목은 서버가 제외하고 반환한다.

**Response** `200` → [`Task`](#task)`[]`

> **현재 프론트 계약**: 목업 단계에서는 필터(`status`/`assignee`/`priority`/`tag`)·그룹핑·검색·페이지네이션을 **전부 클라이언트에서** 응답 전체에 대해 처리한다 (`TaskListPage.vue`가 `route.query`로 계산). 즉 현재 이 엔드포인트는 쿼리 파라미터를 받지 않는다.
> 프로젝트당 업무 수가 커지면 `DEN-DESIGN.md` 6.1절에 예약된 `?status=&assignee=&priority=&tag=&group=&view=` 쿼리 파라미터를 서버 필터링으로 구현하는 것을 권장한다 — 이 경우 프론트도 함께 맞춰 변경 필요.

### `GET /api/tasks?scope=all`
목업 함수: `fetchAllTasks(): Promise<Task[]>`
전체 프로젝트 홈의 카드별 진행률 통계 계산용 — 요청자가 접근 가능한 **모든 프로젝트**의 업무.

**Response** `200` → [`Task`](#task)`[]`

### `GET /api/me/task-count`
목업 함수: `fetchMyTaskCount(): Promise<number>`
사이드바 "내 업무" 배지. `assigneeIds`에 내가 포함되고 `status !== 'done'`인 업무 수.

**Response** `200` → `number`

### `GET /api/tasks/{taskId}`
목업 함수: `fetchTaskById(taskId): Promise<Task | undefined>`

**Response** `200` → [`Task`](#task) / `404`

### `GET /api/tasks/{taskId}/subtask-count`
목업 함수: `fetchSubtaskCount(taskId): Promise<number>` — `parentId === taskId`인 업무 수.

**Response** `200` → `number`

### `POST /api/tasks/{parentId}/subtasks`
목업 함수: `createSubtask(parentId, title): Promise<Task>`

**Request** `{ title: string }`

**Response** `201` → [`Task`](#task)

**비고**: 서버가 `code`를 자동 발급한다 — 부모의 프로젝트 접두어(`code.split('-')[0]`)에 그 프로젝트 내 최대 순번 + 1을 붙인다 (예: `APP-142`의 하위업무 → `APP-201`처럼 프로젝트 전체에서 다음 순번). `status: 'todo'`, `priority: 'medium'`, `progress: 0`, `isPrivate: false`, `parentId`는 요청받은 부모 ID, `startDate`/`endDate`는 부모와 동일하게 초기화.

### `PATCH /api/tasks/{taskId}/status`
목업 함수: `updateTaskStatus(taskId, status): Promise<Task | undefined>`

**Request**
```ts
{ status: TaskStatus }  // 'todo' | 'progress' | 'review' | 'done'
```
**Response** `200` → [`Task`](#task) / `404`

**비고**: `status === 'done'`이면 서버가 `progress`를 자동으로 `100`으로 맞춘다.

### `PATCH /api/tasks/{taskId}`
목업 함수: `updateTask(taskId, patch): Promise<Task | undefined>`

**Request** (부분 수정, 아래 필드만 허용)
```ts
type TaskPatch = Partial<
  Pick<Task, 'title' | 'priority' | 'startDate' | 'endDate' | 'progress' | 'isPrivate'>
>
```
**Response** `200` → [`Task`](#task) / `404`

### `PATCH /api/tasks/{taskId}/assignees`
목업 함수: `updateTaskAssignees(taskId, assigneeIds): Promise<Task | undefined>`
담당자 전체 목록을 교체한다 (부분 추가/삭제 아님).

**Request** `{ assigneeIds: string[] }`
**Response** `200` → [`Task`](#task) / `404`

**비고**: 새로 추가된 담당자에게 `task_assigned` 알림 생성 (7장 참고).

### `PATCH /api/tasks/{taskId}/dependencies`
목업 함수: `updateTaskDependencies(taskId, dependencyIds): Promise<Task | undefined>`
간트차트 선행 업무 목록 전체 교체.

**Request** `{ dependencyIds: string[] }`
**Response** `200` → [`Task`](#task) / `404`

### `GET /api/projects/{projectKey}/tags`
목업 함수: `fetchTagsByProjectKey(projectKey): Promise<Tag[]>`

**Response** `200` → [`Tag`](#tag)`[]`

---

## 5. 댓글

### `GET /api/tasks/{taskId}/comments`
목업 함수: `fetchCommentsByTaskId(taskId): Promise<Comment[]>`
`createdAt` 오름차순 정렬해 반환.

**Response** `200` → [`Comment`](#comment)`[]`

### `POST /api/tasks/{taskId}/comments`
목업 함수: `addComment(taskId, body, mentionUserIds): Promise<Comment>`

**Request**
```ts
{ body: string; mentionUserIds: string[] }
```
**Response** `201` → [`Comment`](#comment)

**비고**: 서버는 댓글 생성과 함께
1. `task.commentCount`를 1 증가시키고,
2. `mentionUserIds`에 포함된 사용자에게 `task_mention` 알림을,
3. 그 외 해당 업무의 담당자·참여자(작성자 본인 제외)에게 `task_comment` 알림을
생성한다.

---

## 6. 메신저

### `GET /api/projects/{projectKey}/channels`
목업 함수: `fetchChannelsByProjectKey(projectKey): Promise<Channel[]>`
각 채널의 `unreadCount`는 요청자 기준 (채널의 `last_read_at` 이후 메시지 수).

**Response** `200` → [`Channel`](#channel)`[]`

### `GET /api/projects/{projectKey}/channels/unread-count`
목업 함수: `fetchUnreadChannelCount(projectKey): Promise<number>`
컨텍스트 바 "메신저" 탭 배지 — 프로젝트 내 모든 채널의 안읽음 합계.

**Response** `200` → `number`

### `GET /api/channels/{channelId}/messages`
목업 함수: `fetchMessagesByChannelId(channelId): Promise<Message[]>`

**Response** `200` → [`Message`](#message)`[]`

> `DEN-DESIGN.md` 6.1절에는 `?before=&limit=` 커서 페이지네이션이 예약되어 있다. 목업은 채널의 전체 메시지를 반환하므로, 메시지 양이 많아지면 서버 구현 시 커서 기반 페이지네이션을 추가하고 프론트도 무한 스크롤로 맞춰 변경한다.

### `POST /api/channels/{channelId}/messages`
목업 함수: `sendMessage(channelId, body, mentionUserIds): Promise<Message>`

**Request**
```ts
{ body: string; mentionUserIds: string[] }
```
**Response** `201` → [`Message`](#message)

**비고**: 저장과 동시에 STOMP `/topic/channel/{channelId}`로 브로드캐스트한다 (6.5절). 채널을 지금 보고 있지 않은 멤버에게는 `channel_message` 알림도 생성한다.

### `POST /api/channels/{channelId}/read`
목업 함수: `markChannelRead(channelId): Promise<void>`
요청자의 `last_read_at`을 현재 시각으로 갱신 (해당 채널 안읽음 수 0으로).

**Response** `204`

---

## 7. 알림

### `GET /api/notifications`
목업 함수: `fetchNotifications(): Promise<AppNotification[]>`
요청자 본인의 알림 전체, 최신순.

**Response** `200` → [`AppNotification`](#appnotification)`[]`

### `GET /api/notifications/unread-count`
목업 함수: `fetchUnreadNotificationCount(): Promise<number>`

**Response** `200` → `number`

### `POST /api/notifications/{notificationId}/read`
목업 함수: `markNotificationRead(notificationId): Promise<void>`

**Response** `204`

### `POST /api/notifications/read-all`
목업 함수: `markAllNotificationsRead(): Promise<void>`
요청자 본인의 안읽음 알림 전체를 읽음 처리.

**Response** `204`

**알림 생성 트리거 정리** (서버가 상황별로 `AppNotification`을 만들어야 하는 지점):

| `NotificationType` | 생성 시점 |
|---|---|
| `task_assigned` | `PATCH /tasks/{id}/assignees`로 새로 담당자에 추가됐을 때 |
| `task_comment` | 댓글 작성 시, 멘션 대상 제외한 담당자·참여자에게 |
| `task_mention` | 댓글 본문에서 멘션됐을 때 |
| `task_due_soon` | `endDate`가 임박(당일/1일 전)했는데 `status !== 'done'`인 업무 — 배치/스케줄러가 생성 |
| `task_status_changed` | `PATCH /tasks/{id}/status`로 상태가 바뀌었을 때, 담당자·참여자에게 |
| `channel_message` | 채널 메시지 발송 시, 그 채널을 보고 있지 않은 멤버에게 |
| `project_invited` | `POST /projects/{projectKey}/members`로 초대됐을 때 |

---

## 8. WebSocket (STOMP) — 참고

REST가 아니지만 메신저·알림 실시간성에 필요한 계약. 상세는 `DEN-DESIGN.md` 6.2절.

```
연결   /ws                              JWT 핸드셰이크 인증
구독   /topic/channel/{channelId}       채널 새 메시지 → Message
구독   /user/queue/notifications        개인 알림 실시간 → AppNotification
발행   /app/channel/{channelId}/send    메시지 전송 (REST POST 대신 또는 함께 사용 가능)
발행   /app/channel/{channelId}/typing  입력 중 표시
```

---

## 9. 타입 정의 (요청·응답에서 참조)

`src/mock/types.ts`와 동일하다. 필드 의미가 자명하지 않은 것만 주석으로 부연했다.

```ts
type TaskStatus = 'todo' | 'progress' | 'review' | 'done'
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
type MenuKey = 'tasks' | 'gantt' | 'messenger'
type NotificationType =
  | 'task_mention'
  | 'task_assigned'
  | 'task_comment'
  | 'task_due_soon'
  | 'task_status_changed'
  | 'channel_message'
  | 'project_invited'
```

#### User
```ts
interface User {
  id: string
  name: string
  email: string
  initials: string
  avatarGradient: string   // 예: 'linear-gradient(135deg,#f59e0b,#ef4444)'
  title?: string           // 예: '프로젝트 리드'
}
```

#### Project
```ts
interface Project {
  id: string
  key: string              // 사람이 읽는 키 ("APP"). URL에 노출됨
  name: string
  description: string
  color: string             // 사이드바 점 색상 / 카드 마크 배경
  folderId: string | null   // null이면 미분류 (요청자 개인 배치 기준)
  memberIds: string[]
}
```

#### Folder
```ts
interface Folder {
  id: string
  name: string
  collapsed?: boolean
}
```

#### Role
```ts
interface Role {
  id: string
  projectId: string
  name: string
  isAdmin: boolean
  menuPermissions: Record<MenuKey, boolean>
}
```

#### ProjectMember
```ts
interface ProjectMember {
  userId: string
  projectId: string
  roleId: string
  invitedAt: string   // ISO date
}
```

#### Tag
```ts
interface Tag {
  id: string
  projectId: string
  name: string
}
```

#### Task
```ts
interface Task {
  id: string
  code: string              // 예: "APP-142"
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeIds: string[]     // 다대다
  watcherIds: string[]
  parentId: string | null
  dependencyIds: string[]   // 선행 업무 (간트용)
  tagIds: string[]
  startDate: string         // ISO date
  endDate: string           // ISO date
  progress: number          // 0-100
  isPrivate: boolean
  commentCount: number
}
```

#### Comment
```ts
interface Comment {
  id: string
  taskId: string
  authorId: string
  body: string
  mentionUserIds: string[]
  createdAt: string   // ISO datetime
}
```

#### Channel
```ts
interface Channel {
  id: string
  projectId: string
  name: string
  type: 'group' | 'dm'
  memberIds: string[]
  unreadCount: number   // 요청자 기준
}
```

#### Message
```ts
interface Message {
  id: string
  channelId: string
  authorId: string
  body: string
  mentionUserIds: string[]
  createdAt: string   // ISO datetime
}
```

#### AppNotification
```ts
interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  projectKey: string | null
  linkTaskId?: string      // 있으면 업무 상세로 이동
  linkChannelId?: string   // 있으면 해당 채널로 이동
  isRead: boolean
  createdAt: string   // ISO datetime
}
```
