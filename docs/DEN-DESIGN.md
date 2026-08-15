# den 설계 문서

프로젝트 관리 + 메신저 사내 솔루션 (Dooray 영감).
이 문서는 지금까지 확정한 결정들의 단일 기준점(source of truth)이다.
개발 중 판단이 헷갈릴 때 이 문서를 우선한다.

최종 수정: 2026-08-15 (프론트 스택 Vue로 변경, 개발 순서·사업모델 검토 추가)

---

## 1. 제품 개요

### 1.0 브랜드 (확정)
제품명은 **den** (전부 소문자).

| 요소 | 이름 | 의미 |
|---|---|---|
| 조직/팀 | **pleanb** | Lean하게 계획하고, Plan B의 대안을 제시하는 팀 |
| 제품 (이 프로젝트) | **den** | 소수 정예 크루가 방해받지 않고 일하는 아늑한 디지털 아지트 |
| 공식 메일 | **break@pleanb.com** | 무거운 루프와 관습에서 탈출해 즐겁게 일하는 창구 |

세계관: **탈출(break)해서 린하게 계획(pleanb)하는 우리들의 아지트(den).**

> 표기 규칙: 항상 소문자 `den`. 문장 첫머리에서도 대문자화하지 않는다.
> UI 로고, 저장소명, 패키지명 모두 소문자 통일.
> "아지트" 컨셉은 사내 온프레미스·폐쇄망 포지셔닝과도 일치한다.

### 1.1 목표
- 사내에서 매일 쓰는 프로젝트 관리 + 메신저 도구.
- 검증 후 **10인 미만 무료 오픈소스**로 공개, **유료 설치·설정·지원**으로 수익화.
- 솔로 개발. 따라서 모든 결정의 우선순위는 **"검증된 것 · 단순한 것 · 학습 총량 최소"**.

### 1.2 범위 (MVP)
포함:
- 프로젝트 CRUD + 멤버 관리
- 업무 CRUD (제목/설명/담당자/상태/우선순위/태그/시작일/종료일/진행률)
- 업무 계층(부모-자식) + 의존성(선행 업무) — 간트용
- 리스트 뷰 + 간트 뷰
- 업무 댓글/멘션
- 실시간 메신저 (채널 + 1:1)
- 알림
- 3단 권한 (프로젝트 / 메뉴 / 게시물)
- 개인 폴더 정리 + 즐겨찾기

제외 (나중에):
- Tauri 데스크톱/모바일 앱, OS 네이티브 알림
- 드라이브, 위키, 캘린더, 메일, 전자결재, 화상회의 (Dooray에서 뺀 것)
- 칸반 보드 (지금 불필요, 나중에 추가 용이)

### 1.3 개발 순서 (확정)
**프론트엔드를 먼저 완주한 후 백엔드를 구현한다.**
- 백엔드·프론트를 번갈아 개발하지 않음. 한쪽을 끝내고 다음으로 이동.
- 이유: AI 협업 시 컨텍스트 유실로 양쪽 불일치가 발생하고, 산출물이 두 프로젝트로
  분산되어 관리가 어려움. (일반적인 "수직 슬라이스" 조언은 사람 팀 전제라 여기선 부적합)
- 프론트에서 확정된 데이터 요구사항이 곧 백엔드 API 계약이 됨.

기능 우선순위:
1차: 프로젝트 관리(업무 + 간트 + 댓글 + 알림)
2차: 메신저 (실시간 인프라가 별도 난이도)
단, 데이터 모델은 처음부터 메신저까지 포함해 확장이 매끄럽도록 설계함.

### 1.4 화면 작업량 (추정)
| 구분 | 개수 |
|---|---|
| 페이지 (라우트) | 9 |
| 공통 레이아웃·구조 | 4 |
| 모달·팝업·패널 | 12 |
| 인라인 인터랙티브 조각 | 14 |
| **소계** | **약 39** |
| + 로딩·빈상태·에러·반응형 | 실질 45~50 |

화면 단위로 끊어 하나씩 완성. 각 화면에 딸린 모달·인라인 조각을 함께 구현.
권장 순서: 공통 토대 → 전체 프로젝트 홈 → 업무 리스트 → 업무 상세 →
간트 → 권한·멤버 → 메신저 → 알림

---

## 2. 기술 스택 (확정)

### 2.1 프론트엔드
| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Vue 3 + TypeScript** | 컨벤션이 일관되고 프레임워크가 안정적. 대기업 로드맵(Meta/Vercel)에 휘둘리지 않아 예측 가능. 혼자 오래 유지보수하기에 유리 |
| 빌드 | **Vite** | Vue 공식 빌드 도구. Tauri 확장 시 정적 빌드 그대로 사용 가능 |
| 라우팅 | **Vue Router** | URL 우선 원칙 구현 (`route.query`) — 아래 4.3 |
| UI | **shadcn-vue** | shadcn/ui의 Vue 포팅. 코드 소유 방식 → 오픈소스 라이선스 깨끗. CSS 변수 토큰 동일 |
| 스타일 | **Tailwind CSS v4** | shadcn-vue 기반 |
| 서버 상태 | **@tanstack/vue-query** | 캐싱 → 뒤로가기 시 재요청 없이 즉시 표시 (HTML 캐싱 경험 재현) |
| 전역 상태 | **Pinia** | Vue 공식 상태관리. 로그인 사용자·실시간 카운트·WS 연결만 |
| 간트차트 | **frappe-gantt** (MIT) | 프레임워크 독립(순수 JS) → Vue에서 그대로 사용. 라이선스 깨끗 |
| 실시간 | **@stomp/stompjs** | 메신저 WebSocket 클라이언트 (프레임워크 무관) |
| HTTP | **axios** | JWT 인터셉터 |

> **Nuxt를 쓰지 않는 이유**: SSR/SEO가 불필요(사내·로그인 앱)하고, 백엔드가
> Spring Boot라 Nuxt 서버 기능이 중복됨. 레이어가 늘면 완주 난이도만 올라감.
> Tauri 확장 시 정적 빌드가 필요한데 Nuxt SSR과 상충.

### 2.2 백엔드
| 항목 | 선택 |
|---|---|
| 프레임워크 | Spring Boot 3.x (Java 21) |
| API | Spring Web (REST, MVC 동기) |
| 실시간 | Spring WebSocket + STOMP |
| 인증 | Spring Security + JWT |
| ORM | Spring Data JPA |
| DB | PostgreSQL (계층형 업무·의존성에 적합) |
| 캐시/세션/브로커 | Redis (WS 세션, 알림 큐, 다중 서버 대비) |

> 메신저의 실시간성은 STOMP over WebSocket이 표준. WebFlux 대신 MVC(동기)로
> 가는 게 레퍼런스·러닝커브상 안전 (확정).

### 2.3 확장 경로 (나중에, 방향만)
- 데스크톱/모바일: **Tauri 2.0** 으로 Vue 웹을 감쌈. Vue 웹 코드 그대로 재사용.
- OS 네이티브 알림: Tauri notification 플러그인. (Capacitor는 데스크톱 미지원이라 부적합)
- iOS 정식 배포 시 WebView 래퍼 심사(4.2) 리스크 대비 필요.

---

## 3. 디자인 시스템 (확정)

### 3.1 컨셉
**Notion의 밝기 + Linear의 구조 + 인디고 액센트 + 큰 둥근 모서리 + 라이트 모드**

레퍼런스: Artofit 프로젝트 대시보드(무채색 베이스 + 데이터에만 컬러)에서
UI 강조색만 인디고로 교체.

### 3.2 토큰
| 요소 | 값 |
|---|---|
| 배경 | 밝은 회백색 `#f7f8fa` (순백 아님) |
| 카드/패널 | 흰색 `#ffffff` + 미세 그림자 + 큰 둥근 모서리 |
| 모서리 반경 | 14px (`--radius`) |
| 텍스트 | 짙은 회색 `#1e2230` (순검정 아님) |
| 보조 텍스트 | `#6b7280` |
| 경계선 | `#eceef2` (얇게) |
| **액센트(primary)** | **인디고 `#4f46e5`** — 버튼·활성·링크·선택·포커스 |
| 인디고 소프트 | `#eef2ff` — 선택 배경 |

### 3.3 상태색 (데이터 전용)
| 상태 | 배경 / 텍스트 |
|---|---|
| 할 일 (todo) | `#f1f2f5` / `#565d6d` |
| 진행 중 (progress) | `#eef2ff` / `#4f46e5` |
| 검토 (review) | `#fff4e5` / `#b76a09` |
| 완료 (done) | `#e7f6ee` / `#1a9457` |

우선순위: 긴급 `#e5484d` / 높음 `#f2820c` / 보통 `#4f46e5` / 낮음 `#9ca3af`

> 실제 토큰은 index.css에 shadcn/ui oklch 변수로 구현됨.
> 원칙: UI 강조는 인디고 하나, 색은 데이터/상태에만.

---

## 4. 데이터 모델 (ERD)

### 4.1 테이블 구성
```
[사용자·프로젝트]
USER, PROJECT

[권한 — 역할 기반]
PROJECT_ROLE       역할 정의 (관리자/편집자/뷰어), is_admin
ROLE_MENU_PERM     역할 × 메뉴(업무/간트/메신저) 접근 on/off
PROJECT_MEMBER     사용자 × 프로젝트 × 역할

[개인 정리 — 개인용, 권한과 무관]
FOLDER             개인 폴더 (user_id 소유, 정리함)
PROJECT_PLACEMENT  사용자 화면에서 프로젝트의 폴더 배치 (user_id 포함)
FAVORITE           즐겨찾기 (user_id × project_id)

[업무]
TASK               parent_id(계층), start/end_date·progress(간트), is_private(공개여부)
TASK_ASSIGNEE      담당자 (다대다)
TASK_WATCHER       참여자/관찰자 (비공개 접근권 + 알림 대상)
TASK_DEPENDENCY    선행 업무 (간트 의존성)
TAG, TASK_TAG      태그 (프로젝트별, 업무에 다대다)
COMMENT            댓글 + mentions(JSON)

[메신저]
CHANNEL            채널 (type: 그룹/1:1)
CHANNEL_MEMBER     참여자 + last_read_at(안읽음 계산)
MESSAGE            메시지 + mentions

[알림]
NOTIFICATION       통합 알림 (type, source_id, is_read)
```

### 4.2 핵심 설계 판단
1. **담당자 다대다** (`TASK_ASSIGNEE` 별도 테이블). 여러 명 배정 가능.
2. **참여자(`TASK_WATCHER`)가 이중 역할**: 비공개 업무 접근권 + 알림 수신 대상.
3. **메뉴 권한 정규화** (`ROLE_MENU_PERM`): 메뉴 늘어도 행만 추가.
4. **폴더는 개인용**: `PROJECT_PLACEMENT.user_id`로 "이 사용자 화면에서의 배치" 표현.
   같은 프로젝트도 사람마다 다른 폴더 가능. `folder_id`가 null이면 미분류(최상위).
   폴더 삭제해도 프로젝트는 미분류로 빠짐 (정리함이므로).

### 4.3 URL 우선 원칙 (중요)
필터·뷰·그룹핑·페이지네이션 등 "뒤로가기로 복원돼야 하는 상태"는 컴포넌트
상태(`ref`)가 아니라 **URL 쿼리스트링**에 둔다. Vue Router `route.query`로 관리.

> 이 원칙을 어기면(페이지 번호를 `ref`에만 두면) 뒤로가기 시 1페이지로 리셋되는
> 문제가 발생한다. 이는 React·Vue 공통 현상이며 프레임워크가 아니라 **프로젝트
> 규칙**으로 강제해야 한다. 기여자 온보딩 시 반드시 전달할 것.
→ 뒤로가기·북마크·새로고침이 HTML처럼 동작. (사용자가 겪던 SPA 답답함의 해결책)

상태 배치 규칙:
- 서버 데이터 → TanStack Query
- 뒤로가기 복원 대상(필터/뷰/그룹) → URL
- 진짜 전역(로그인·WS·알림수) → Pinia
- 화면 일시 상태(드롭다운 등) → `ref` / `reactive`

---

## 5. 권한 모델 (3단, 확정)

### 5.1 프로젝트 권한 (역할 기반)
- 멤버는 프로젝트에 속할 때 역할 하나 가짐: 관리자 / 편집자 / 뷰어.
- 역할에 권한 묶임. 사람마다 개별 지정 안 함.
- 멤버 아니면 프로젝트 자체가 안 보임.

### 5.2 메뉴 권한 (역할 기반, 보이기/숨기기)
- 역할별로 메뉴(업무/간트/메신저) 접근 on/off.
- 예: 뷰어는 메신저 숨김.
- 보기/편집 구분은 안 함 (접근 여부만). `ROLE_MENU_PERM`.

### 5.3 게시물(업무) 권한 (공개/비공개 토글)
- 업무마다 `is_private` 플래그 하나.
- 비공개면 담당자(`TASK_ASSIGNEE`) + 참여자(`TASK_WATCHER`)만 조회.
- 나머지 멤버에겐 목록에서 숨김.
- 사람을 콕 집는 방식 아님 (단순 토글).

### 5.4 권한 체크 원칙
**모든 권한 판단은 서버에서.** 프론트에서 숨기는 게 아니라 서버가 안 내려줌.
- 비공개 업무: 서버가 "요청자가 담당자/참여자인가" 확인 후 목록에서 제외.
- 메뉴 권한: 서버가 역할 보고 차단.

---

## 6. API 설계

### 6.1 REST 엔드포인트
```
[인증]
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

[프로젝트]
GET    /api/projects                  내가 속한 프로젝트 (폴더 그룹 + 즐겨찾기 플래그)
POST   /api/projects
GET    /api/projects/{id}             내 역할·접근가능 메뉴 포함
PATCH  /api/projects/{id}             (관리자)
DELETE /api/projects/{id}             (관리자)

[개인 폴더·즐겨찾기]
GET    /api/folders                   내 폴더 목록
POST   /api/folders
PATCH  /api/folders/{id}              이름·순서
DELETE /api/folders/{id}              (내부 프로젝트는 미분류로)
PATCH  /api/projects/{id}/placement   프로젝트를 폴더로 배치/이동 (내 화면만)
POST   /api/projects/{id}/favorite    즐겨찾기 토글

[멤버·역할]
GET    /api/projects/{id}/members
POST   /api/projects/{id}/members     초대(역할 지정)
PATCH  /api/projects/{id}/members/{userId}
DELETE /api/projects/{id}/members/{userId}
GET    /api/projects/{id}/roles
POST   /api/projects/{id}/roles
PATCH  /api/projects/{id}/roles/{roleId}   역할·메뉴권한 수정

[업무]
GET    /api/projects/{id}/tasks       ?status=&assignee=&priority=&tag=&group=&view=
                                       (비공개 업무는 서버가 필터링)
POST   /api/projects/{id}/tasks
GET    /api/tasks/{taskId}            하위업무·의존성·담당자·태그 포함
PATCH  /api/tasks/{taskId}
DELETE /api/tasks/{taskId}
PATCH  /api/tasks/{taskId}/assignees      담당자 다대다
PATCH  /api/tasks/{taskId}/dependencies   의존성 (간트)
PATCH  /api/tasks/{taskId}/order          순서/부모 변경

[댓글·태그]
GET    /api/tasks/{taskId}/comments
POST   /api/tasks/{taskId}/comments       멘션 포함
GET    /api/projects/{id}/tags
POST   /api/projects/{id}/tags

[메신저]
GET    /api/projects/{id}/channels        안읽음 수 포함
POST   /api/projects/{id}/channels
GET    /api/channels/{channelId}/messages ?before=&limit=
POST   /api/channels/{channelId}/read     읽음 처리

[알림]
GET    /api/notifications ?unread=
POST   /api/notifications/{id}/read
POST   /api/notifications/read-all
```

### 6.2 WebSocket (STOMP)
```
연결   /ws                              JWT 핸드셰이크 인증
구독   /topic/channel/{channelId}       채널 새 메시지
구독   /user/queue/notifications        개인 알림 실시간
발행   /app/channel/{channelId}/send    메시지 전송
발행   /app/channel/{channelId}/typing  입력 중 표시
```

원칙: 실시간 필요한 것(메시지·알림·타이핑)만 STOMP, 나머지는 REST.
→ 실시간 복잡도를 메신저에만 국한 (솔로 개발 부담 감소).

---

## 7. 프론트 라우팅·화면 구조

### 7.1 URL 구조
```
/login
/                                     내 프로젝트 홈 (전체 프로젝트)
/p/:projectKey/tasks                  업무 (리스트/간트)
    ?view=list|gantt
    ?status=&assignee=&priority=&tag=
    ?group=status|assignee|none
/p/:projectKey/tasks/:taskId          업무 상세 (패널, URL은 바뀜)
/p/:projectKey/messenger[/:channelId] 메신저
/p/:projectKey/settings/members       멤버 관리
/p/:projectKey/settings/roles         역할·권한
/notifications                        알림 전체
```
- projectKey는 사람이 읽는 키("APP") 사용. uuid 노출 안 함.

### 7.2 레이아웃 구조 (멀티 프로젝트 대응)
50~100개 프로젝트를 감당하기 위한 구조 (Dooray 패턴):

**사이드바** (프로젝트 탐색 전용):
- 상단 프로젝트 검색
- 고정 메뉴: 전체 프로젝트 / 내 업무 / 최근 본 항목
- 즐겨찾기 섹션 (자주 쓰는 것 위로)
- 폴더 그룹핑 (접기/펼치기, 개인용 정리함)

**상단 컨텍스트 바** (선택된 프로젝트 안의 메뉴):
- 프로젝트명 + 탭: 업무 / 간트차트 / 메신저 / 설정
- 메뉴 권한에 따라 탭 표시/숨김
- 업무 검색, 알림 벨

> 업무/간트/메신저를 사이드바가 아닌 상단 바로 분리한 이유:
> 이들은 "특정 프로젝트 안의 메뉴"라 사이드바(프로젝트 목록)와 충돌하기 때문.
> 프로젝트가 많아질수록 이 분리가 필수.

**전체 프로젝트 홈** (`/`):
- 큰 검색 + 카드/목록 전환
- 즐겨찾기 → 폴더별 섹션으로 카드 그리드
- 카드: 이름/키, 설명, 상태별 진행 요약 바, 업무 통계, 멤버 아바타, 내 역할 배지

### 7.3 컴포넌트 트리 (요약)
```
App
├─ AuthGuard → AppLayout (Sidebar + ContextBar + Outlet)
├─ ProjectHomePage        전체 프로젝트 (카드 그리드)
├─ TaskListPage           리스트/간트 + 상세 패널
│   ├─ TaskToolbar (URL 쿼리 동기화)
│   ├─ TaskListView / TaskGanttView
│   └─ TaskDetailPanel (담당자·의존성·하위업무·댓글)
├─ MessengerPage          채널목록 + 채팅(STOMP)
├─ SettingsPage           MembersPanel / RolesPanel
└─ NotificationsPage
```

폴더 구조는 feature 기반 (src/features/{auth,projects,tasks,messenger,permissions,notifications}).
상세는 folder-structure.txt 참조.

---

## 8. 미해결·향후 결정 사항

### 8.1 기술
- 간트차트 라이브러리 최종 확정 (frappe-gantt로 시작, 고급 기능 필요 시 재검토)
- 파일 첨부 (댓글·메시지) 저장 방식 — MVP 범위 밖, 추가 시 결정
- 알림 실시간 vs 폴링 세부 — STOMP 개인 큐로 시작

### 8.2 사업 모델 (지금 확정하지 않음)
**원칙: 사내에서 6개월 실사용 후, 그때 나온 데이터로 결정.**
지금 정해봐야 근거가 없고, 세 모델 모두 "좋은 제품을 만든다"가 공통 전제이므로
현 단계에서는 개발 완주에 집중한다.

검토한 선택지와 평가:
| 모델 | 평가 |
|---|---|
| 오픈소스 진영 + 팀 구성 | 기여자는 제품이 알려진 뒤에 옴. 오픈소스는 사업 모델이 아니라 **마케팅·신뢰 장치**로 보는 게 정확 |
| **제품 납품 (온프레미스)** | **가장 현실적.** 보안 도메인·B2B 경험과 맞음. 망분리·공공기관 등 SaaS를 못 쓰는 조직이 실재하는 틈새 |
| SaaS | 확장성은 높으나 솔로에겐 위험(24/7 가용성·결제·멀티테넌시·지원). 기존 강자(Dooray/Jira/Notion)와 정면 경쟁 |

현재 유력 방향: **코어 오픈소스 공개(코드 검증 가능 → 보안 중시 조직 설득) +
설치·커스터마이징·유지보수 계약으로 수익.** 망분리/폐쇄망 환경을 정면 겨냥.

### 8.3 LLM 도입 (검토 중)
"기능이 빈약해서 AI를 얹는다"는 접근은 차별화가 안 되므로 지양.
대신 **폐쇄망에서 동작하는 온프레미스 LLM**은 포지셔닝을 완성하는 조각이 될 수 있음
(망분리 조직은 외부 AI 서비스 사용 불가 → 구조적으로 SaaS 경쟁자가 못 들어감).
기능은 화려한 것보다 실용적인 것 — 업무 요약, 긴 스레드 요약 수준으로 충분.

---

## 9. 결정 로그 (왜 이렇게 정했나)
- **Vue > React** *(2026-08-15 결정 변경)*:
  초기엔 생태계 규모·기여자 풀을 근거로 React를 택했으나, 최종 기준을
  **완주 · 가벼움 · 안정성**으로 정리하면서 Vue로 확정.
  - React 진영이 Server Components·컴파일러 등으로 지속 무거워지고, 그 방향이
    Meta/Vercel의 사업 논리(대규모 SSR)에서 나옴 → 사내 대시보드엔 불필요한 복잡도
  - Vue는 커뮤니티 주도로 파괴적 변화가 적고 컨벤션이 일관 → 혼자 오래 유지보수 유리
  - 트레이드오프(감수함): 기여자 풀·라이브러리 선택지가 React보다 작음.
    단 이 프로젝트가 필요한 건 리스트·간트·채팅 수준이라 Vue로 충분하고,
    간트는 프레임워크 독립(frappe-gantt)이라 애초에 무관.
- **순수 Vue > Nuxt**: 사내·로그인 앱이라 SSR/SEO 불필요. Spring Boot와 서버 중복.
  레이어가 늘면 완주 난이도 상승. Tauri 정적 빌드에도 순수 Vue가 유리.
- **Tauri(나중) > Electron/Capacitor 병행**: Tauri 하나로 5개 플랫폼 + 네이티브 알림. 단 지금은 안 함.
- **shadcn-vue**: 코드 소유 → 오픈소스 라이선스 깨끗 + 무한 커스텀. 조립 부담은 AI가 처리.
  디자인 토큰(3장)은 React판과 동일하므로 확정한 디자인이 그대로 유효.
- **프론트 완주 후 백엔드**: AI 협업 시 양쪽 번갈아 개발하면 컨텍스트 유실로
  불일치 발생. 한쪽씩 끝내는 게 실전상 안전 (사용자 관찰에 근거).
- **폴더 = 단순 정리함 + 개인용**: 권한 충돌 회피. 구현 단순.
- **메신저만 STOMP**: 실시간 복잡도 국한.
- **권한 전부 역할 기반 + 단순 플래그**: 개별 권한 폭발 회피, 유지보수 용이.
