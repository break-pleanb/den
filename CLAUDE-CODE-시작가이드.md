# Claude Code 시작 가이드 (den 프로젝트)

IntelliJ 사용자 기준. VSCode 불필요.

---

## 1. 설치 (최초 1회)

Node.js 20 이상이 필요하다. (`node -v`로 확인)

```bash
npm install -g @anthropic-ai/claude-code
```

설치 확인:
```bash
claude --version
```

---

## 2. 프로젝트 폴더 준비

```bash
mkdir den-web
cd den-web
```

이 폴더에 아래 구조로 문서를 배치한다:

```
den-web/
├── CLAUDE.md                        ← 동봉 파일 (Claude Code가 매번 자동으로 읽음)
├── docs/
│   └── DEN-DESIGN.md              ← 전체 설계 문서
└── design-reference/
    ├── project-list-v2.html         ← 업무 리스트 디자인 샘플
    └── all-projects-home.html       ← 프로젝트 홈 디자인 샘플
```

> `design-reference/`의 HTML 샘플이 중요하다. Claude Code가 새 화면을 만들 때
> 이 파일들을 열어보고 톤·구조·간격을 맞춘다. 없으면 디자인이 흔들린다.

---

## 3. 실행

IntelliJ 하단의 내장 터미널(Alt+F12)에서:

```bash
claude
```

처음 실행하면 로그인 절차가 나온다. 브라우저가 열리고 Claude 계정으로 인증하면 된다.
(Pro 구독이면 별도 결제 없이 사용 가능)

---

## 4. 첫 작업 지시

실행 후 이렇게 입력한다:

```
CLAUDE.md와 docs/DEN-DESIGN.md를 읽고, design-reference/의 HTML 샘플도 확인해줘.
그다음 1단계(공통 토대)부터 시작하자. Vue 3 + Vite 프로젝트를 세팅하고
shadcn-vue, Tailwind, Vue Router, Pinia, vue-query를 설치한 뒤
디자인 토큰을 index.css에 넣어줘.
```

이후로는 단계별로 진행:
```
2단계 전체 프로젝트 홈 화면 만들어줘. design-reference/all-projects-home.html 참고해서.
```

---

## 5. 알아두면 좋은 것

### 자주 쓰는 명령
| 명령 | 용도 |
|---|---|
| `/clear` | 대화 컨텍스트 초기화 (새 작업 시작할 때) |
| `/compact` | 대화가 길어졌을 때 요약해서 컨텍스트 절약 |
| `/cost` | 현재 세션의 토큰 사용량 확인 |
| `Esc` | 진행 중인 작업 중단 |
| `Ctrl+C` 두 번 | 종료 |

### 토큰 관리 (Pro 플랜 주의)
- Claude Code는 토큰 소모가 크다. Pro는 5시간 단위로 한도가 리셋된다.
- **한 세션에서 한 단계씩만** 진행하는 게 좋다.
- 단계가 끝나면 `/clear`로 컨텍스트를 비우고 다음 단계를 시작하면 절약된다.
- 한도에 걸리면 리셋을 기다리거나, 그 사이엔 채팅으로 설계 논의를 하면 된다.

### 작업 흐름 권장
1. 한 단계 지시 → 결과 확인 → IntelliJ에서 직접 실행해보기 (`npm run dev`)
2. 수정할 부분 피드백 → 반영
3. 만족하면 **git commit** (되돌릴 지점 만들기)
4. `/clear` 후 다음 단계

### git을 꼭 쓸 것
Claude Code는 파일을 직접 수정하므로, 잘못됐을 때 되돌릴 방법이 필요하다.
```bash
git init
git add .
git commit -m "1단계 공통 토대 완료"
```
각 단계 완료 시마다 커밋하면 안전하다.

---

## 6. 문제가 생기면

- **디자인이 우리가 정한 것과 다르게 나온다**
  → "design-reference/project-list-v2.html을 다시 보고 톤을 맞춰줘"
- **엉뚱한 방향으로 간다**
  → `Esc`로 중단하고, "CLAUDE.md의 규칙을 다시 확인해줘"
- **컨텍스트를 잃은 것 같다**
  → `/clear` 후 "CLAUDE.md를 읽고 이어서 X 작업 해줘"
- **React 코드를 쓴다**
  → CLAUDE.md에 금지 명시되어 있으나, 발생 시 즉시 지적할 것

---

## 7. 채팅과 역할 분담 (권장)

| 작업 | 어디서 |
|---|---|
| 설계 논의, 방향 결정, 트레이드오프 검토 | 채팅 (claude.ai) |
| 실제 코드 작성, 파일 생성/수정 | Claude Code |
| 디자인 시안 확인 | 채팅 (HTML 샘플 렌더링) |

결정이 바뀌면 `docs/DEN-DESIGN.md`와 `CLAUDE.md`를 갱신하는 것을 잊지 말 것.
