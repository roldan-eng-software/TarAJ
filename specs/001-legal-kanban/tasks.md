# Tasks: Sistema Kanban Jurídico Interno

**Input**: Design documents from `/specs/001-legal-kanban/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Tests are included because the user requested a dedicated Tests phase and the constitution requires validation for authorization, workflow, audit, history, alerts and security rules.

**Organization**: Tasks are ordered for incremental MVP delivery and grouped as requested: Setup, Tests, Core, Integration and Polish. Story labels map to the specification user stories: US1 Kanban task management, US2 history/comments/attachments, US3 alerts, US4 archive.

**Status Legend**: `[x]` = implemented, `[~]` = partial, `[ ]` = pending

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel after its dependencies are complete
- **[Story]**: User-story label for story-specific work
- Every task names the main file or directory to change

## Phase 1: Setup

**Purpose**: Initialize the Next.js/Firebase/Tailwind foundation and project structure.

- [x] T001 Create the Next.js TypeScript project baseline and package scripts in `package.json`
- [x] T002 Configure Tailwind CSS, PostCSS and global styles in `postcss.config.mjs` and `app/globals.css`
- [x] T003 [P] Configure TypeScript path aliases and strict compiler options in `tsconfig.json`
- [x] T004 [P] Configure linting and formatting defaults in `eslint.config.mjs` and `.prettierrc`
- [x] T005 Create the App Router private/public route groups in `app/(auth)/login/page.tsx`, `app/(private)/layout.tsx` and `app/page.tsx`
- [x] T006 Create reusable UI component directories and barrel exports in `components/ui/index.ts`, `components/kanban/index.ts`, `components/tasks/index.ts`, `components/alerts/index.ts` and `components/audit/index.ts`
- [x] T007 Create shared domain, Firebase, utility and type directories in `src/domain/index.ts`, `src/firebase/index.ts`, `src/lib/index.ts` and `src/types/index.ts`
- [x] T008 Define environment variable documentation and local examples in `.env.example`
- [x] T009 Configure Firebase client initialization in `src/firebase/client.ts`
- [x] T010 Configure Firebase Admin initialization for server-side services in `src/firebase/admin.ts`
- [x] T011 Create Firebase rules and index placeholders in `firebase/firestore.rules`, `firebase/storage.rules` and `firebase/indexes.json`
- [x] T012 Create seed script for roles and initial Kanban stages in `scripts/seed-initial-data.ts`

## Phase 2: Tests

**Purpose**: Establish executable acceptance coverage before Core implementation.

- [~] T013 [P] Create test runner configuration for unit, contract and integration tests in `package.json` and `tests/setup/test-env.ts` (test-env.ts missing)
- [x] T014 [P] [US1] Add RBAC unit tests for administrator, coordinator, collaborator and internal reader permissions in `tests/unit/rbac.test.ts`
- [x] T015 [P] [US1] Add workflow transition unit tests for allowed, invalid and backward transitions in `tests/unit/workflow.test.ts`
- [~] T016 [P] [US1] Add task Route Handler contract tests for create, list, detail, update and transition endpoints in `tests/contract/tasks.contract.test.ts` (stub — all assertions placeholders)
- [~] T017 [P] [US1] Add Kanban integration test for create task, move stage and denied unauthorized movement in `tests/integration/kanban-flow.test.ts` (stub)
- [~] T018 [P] [US2] Add history/comment/attachment service tests for append-only history and scoped attachment access in `tests/unit/history-comments-attachments.test.ts` (stub)
- [~] T019 [P] [US2] Add comment and attachment Route Handler contract tests in `tests/contract/comments-attachments.contract.test.ts` (stub)
- [x] T020 [P] [US3] Add notification and due-date service tests for deduplication, upcoming and overdue alerts in `tests/unit/notifications.test.ts`
- [~] T021 [P] [US3] Add alert Route Handler contract tests for inbox and mark-read behavior in `tests/contract/alerts.contract.test.ts` (mostly stubs)
- [~] T022 [P] [US4] Add archive workflow tests for completed-only archive, restore and archived lookup in `tests/unit/archive.test.ts` (stub)
- [~] T023 [P] Add Firestore and Storage security rules smoke tests in `tests/integration/firebase-rules.test.ts` (stub)
- [~] T024 [P] Add quickstart end-to-end scenario checklist test scaffold in `tests/integration/quickstart-validation.test.ts` (stub)

## Phase 3: Core

**Purpose**: Build the MVP in vertical slices while keeping domain rules server-side.

### US1: Gerenciar tarefas no Kanban

**Goal**: Authorized users can sign in, see the Kanban, create tasks, move permitted stages and receive history/audit records.

**Independent Test**: A coordinator creates a task in Entrada, moves it to Em análise, sees it in the new column, and unauthorized movement is blocked.

- [x] T025 [US1] Define shared domain types for users, roles, permissions, tasks and workflow stages in `src/types/domain.ts`
- [x] T026 [US1] Implement role permission matrix and `assertCan` helpers in `src/domain/rbac/rbac-service.ts`
- [x] T027 [US1] Implement request session verification and internal profile loading in `src/domain/auth/auth-service.ts`
- [x] T028 [US1] Implement protected route shell and private navigation in `app/(private)/layout.tsx`
- [x] T029 [US1] Implement login screen and auth state handoff in `app/(auth)/login/page.tsx`
- [x] T030 [US1] Implement `/api/auth/session` Route Handler in `app/api/auth/session/route.ts`
- [ ] T031 [US1] Implement Firestore converters for users, roles, stages and tasks in `src/firebase/converters/core.ts`
- [x] T032 [US1] Implement task validation and reference-code/search normalization in `src/domain/tasks/task-validation.ts`
- [x] T033 [US1] Implement history append service for task creation and movement events in `src/domain/history/history-service.ts`
- [x] T034 [US1] Implement audit service for success, denied and failed critical events in `src/domain/audit/audit-service.ts`
- [x] T035 [US1] Implement task create/list/detail/update service with RBAC and audit side effects in `src/domain/tasks/task-service.ts`
- [x] T036 [US1] Implement centralized workflow transition service with allowed transitions and backward detection in `src/domain/workflow/workflow-service.ts`
- [x] T037 [US1] Implement task Route Handlers for list/create/detail/update in `app/api/tasks/route.ts` and `app/api/tasks/[taskId]/route.ts`
- [x] T038 [US1] Implement transition Route Handler in `app/api/tasks/[taskId]/transitions/route.ts`
- [x] T039 [US1] Implement Kanban board UI with responsive columns in `components/kanban/KanbanBoard.tsx`
- [x] T040 [US1] Implement task card component with priority, due date and responsible summary in `components/kanban/TaskCard.tsx`
- [x] T041 [US1] Implement task create/edit form with sober Tailwind styling in `components/tasks/TaskForm.tsx`
- [x] T042 [US1] Implement Kanban page wiring filters, board and create flow in `app/(private)/kanban/page.tsx`
- [x] T043 [US1] Implement initial Firestore security rules for users, roles, tasks, history and audit deny-by-default behavior in `firebase/firestore.rules`
- [x] T044 [US1] Implement role/stage seed execution path in `scripts/seed-initial-data.ts`

### US2: Preservar histórico, comentários e anexos

**Goal**: Authorized users can view chronological history, add comments and use controlled attachments.

**Independent Test**: A collaborator adds a comment and attachment to an allowed task, sees both in the timeline, and an unauthorized user cannot access the attachment.

- [x] T045 [US2] Extend domain types for history events, comments and attachments in `src/types/domain.ts`
- [x] T046 [US2] Implement task timeline query service in `src/domain/history/history-query-service.ts`
- [x] T047 [US2] Implement comment service with mention extraction hook and audit/history side effects in `src/domain/comments/comment-service.ts`
- [x] T048 [US2] Implement attachment service with task-scoped storage paths and metadata validation in `src/domain/attachments/attachment-service.ts`
- [x] T049 [US2] Implement comments Route Handlers in `app/api/tasks/[taskId]/comments/route.ts`
- [x] T050 [US2] Implement attachment upload, complete and download Route Handlers in `app/api/tasks/[taskId]/attachments/route.ts` and `app/api/tasks/[taskId]/attachments/[attachmentId]/route.ts`
- [x] T051 [US2] Implement task detail page with history, comments and attachments tabs in `app/(private)/tasks/[taskId]/page.tsx`
- [x] T052 [US2] Implement timeline component for readable history events in `components/tasks/TaskTimeline.tsx`
- [x] T053 [US2] Implement comment composer and comment list components in `components/tasks/TaskComments.tsx`
- [x] T054 [US2] Implement attachment upload/list/download components in `components/tasks/TaskAttachments.tsx`
- [x] T055 [US2] Implement Storage security rules for task-scoped attachment access in `firebase/storage.rules`
- [x] T056 [US2] Tighten Firestore rules for comments and attachment metadata in `firebase/firestore.rules`

### US3: Receber alertas úteis

**Goal**: Users receive deduplicated internal and e-mail alerts for important task events and due-date changes.

**Independent Test**: Task creation, responsible changes, stage changes, mentions, due upcoming, due overdue, completion, archive and backward moves create correct alerts without duplicate noise.

- [x] T057 [US3] Extend domain types for alerts and email queue jobs in `src/types/domain.ts`
- [x] T058 [US3] Implement notification service with recipient resolution and dedupe keys in `src/domain/notifications/notification-service.ts`
- [x] T059 [US3] Implement e-mail queue service with provider adapter boundary in `src/domain/notifications/email-queue-service.ts`
- [x] T060 [US3] Implement due-date scan service for upcoming and overdue tasks in `src/domain/notifications/due-date-service.ts`
- [x] T061 [US3] Wire task, workflow and comment services to emit alert events in `src/domain/notifications/notification-events.ts`
- [x] T062 [US3] Implement alert inbox and mark-read Route Handlers in `app/api/alerts/route.ts` and `app/api/alerts/[alertId]/read/route.ts`
- [x] T063 [US3] Implement internal alert inbox UI and unread indicator in `app/(private)/alerts/page.tsx` and `components/alerts/AlertInbox.tsx`
- [x] T064 [US3] Implement e-mail job processing endpoint or scheduled handler boundary in `app/api/admin/email-jobs/route.ts`
- [x] T065 [US3] Tighten Firestore rules for alerts and emailQueue access in `firebase/firestore.rules`

### US4: Arquivar e consultar tarefas concluídas

**Goal**: Authorized users can archive completed tasks, keep history preserved and consult archived tasks separately.

**Independent Test**: A completed task is archived, leaves active Kanban, appears in archived search and remains read-only with full authorized history.

- [x] T066 [US4] Extend workflow service with archive and restore rules in `src/domain/workflow/workflow-service.ts`
- [x] T067 [US4] Implement archive and restore Route Handlers in `app/api/tasks/[taskId]/archive/route.ts` and `app/api/tasks/[taskId]/restore/route.ts`
- [x] T068 [US4] Implement archived task listing service and filters in `src/domain/tasks/archive-query-service.ts`
- [x] T069 [US4] Implement archived tasks page with search and filters in `app/(private)/archive/page.tsx`
- [x] T070 [US4] Implement archive action controls and restore affordance for authorized roles in `components/tasks/ArchiveActions.tsx`
- [x] T071 [US4] Wire archive/restore history, audit and notification events in `src/domain/workflow/archive-events.ts`
- [x] T072 [US4] Tighten Firestore rules for archived task read-mostly behavior in `firebase/firestore.rules`

## Phase 4: Infrastructure & Libs

**Purpose**: Complete missing infrastructure pieces and utility libraries.

- [x] T073 Create Firestore data converters in `src/firebase/converters/core.ts`
- [x] T074 Implement validation utilities in `src/lib/validation/index.ts`
- [x] T075 Implement error handling utilities in `src/lib/errors/index.ts`
- [x] T076 Implement date utilities in `src/lib/dates/index.ts`
- [x] T077 Fix barrel exports for `src/domain/index.ts`, `src/firebase/index.ts`, `src/types/index.ts`, `src/lib/index.ts` and `components/audit/index.ts`
- [x] T078 Create test environment setup in `tests/setup/test-env.ts`

## Phase 5: Integration

**Purpose**: Connect slices, run validations and ensure the MVP behaves as one coherent system.

- [x] T079 Implement real assertions in stub unit tests (T018, T022) in `tests/unit/`
- [x] T080 Implement real assertions in stub contract tests (T016, T019, T021) in `tests/contract/`
- [x] T081 Implement real assertions in stub integration tests (T017, T023, T024) in `tests/integration/`
- [x] T082 Run and fix all RBAC, workflow, history, notification and archive unit tests in `tests/unit/`
- [x] T083 Run and fix all Route Handler contract tests for tasks, comments, attachments and alerts in `tests/contract/`
- [x] T084 Run and fix all integration tests for Kanban, comments/attachments, alerts, archive and security rules in `tests/integration/`
- [x] T085 Validate quickstart scenarios and record any deviations in `specs/001-legal-kanban/quickstart.md`
- [x] T086 Verify Firestore composite indexes for Kanban, archive, alerts and audit queries in `firebase/indexes.json`
- [x] T087 Verify Vercel/Firebase environment variable coverage against `.env.example`
- [x] T088 Perform Constitution Check against implemented behavior and document findings in `specs/001-legal-kanban/implementation-check.md`

## Phase 6: Polish

**Purpose**: Harden usability, security and maintainability before handoff.

- [x] T089 Polish Tailwind spacing, color tokens and responsive behavior across `app/(private)/` and `components/`
- [x] T090 Improve empty, loading, error and permission-denied states in `components/ui/StateViews.tsx`
- [x] T091 Add accessible labels, focus states and keyboard-safe interactions to `components/kanban/KanbanBoard.tsx` and `components/tasks/TaskForm.tsx`
- [x] T092 Review alert copy for clarity and deduplication usefulness in `src/domain/notifications/notification-service.ts`
- [x] T093 Review audit metadata for sensitive data minimization in `src/domain/audit/audit-service.ts`
- [x] T094 Update README setup and MVP operation notes in `README.md`
- [x] T095 Run final build, lint and test command set from `package.json`

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001-T012) must complete before Tests and Core.
- Tests (T013-T024) define expected behavior and should be written before the related Core tasks.
- US1 Core (T025-T044) blocks US2, US3 and US4 because it establishes auth, RBAC, tasks, workflow, history and audit.
- US2 Core (T045-T056) depends on US1 task detail and access controls.
- US3 Core (T057-T065) depends on US1 events and benefits from US2 mention events.
- US4 Core (T066-T072) depends on US1 workflow and US3 archive notification hooks.
- Infrastructure (T073-T078) can proceed in parallel with Core after T025-T027 types/services exist.
- Integration (T079-T088) depends on Core completion.
- Polish (T089-T095) depends on Integration findings.

### User Story Dependencies

- US1 is the MVP base and can be demonstrated independently after T044.
- US2 depends on US1 because comments and attachments require existing tasks and task permissions.
- US3 depends on US1 and partially on US2 for mention alerts.
- US4 depends on US1 and US3 for archive event notifications.

## Parallel Opportunities

- Setup tasks T003, T004, T006, T007 and T008 can run in parallel after T001.
- Test tasks T014-T024 can run in parallel after T013.
- Within US1, UI tasks T039-T042 can run in parallel with server tasks T035-T038 after shared types/services T025-T034 exist.
- Within US2, UI tasks T051-T054 can run in parallel with Route Handler tasks T049-T050 after services T046-T048 exist.
- Within US3, inbox UI T063 can run in parallel with email boundary T064 after notification service T058 exists.
- Infrastructure tasks T073-T078 can run in parallel with each other.
- Integration test tasks T079-T084 can run in parallel after their respective service implementations are done.
- Polish tasks T089-T094 can run in parallel after Integration issues are known.

## Implementation Strategy

### MVP First

1. Complete Setup.
2. Write Tests for auth/RBAC/workflow and Kanban.
3. Complete US1 through T044.
4. Validate a coordinator can create and move a task, history/audit are created, and unauthorized movement is blocked.

### Incremental Delivery

1. Deliver US1: private Kanban, tasks, workflow, history/audit baseline.
2. Add US2: timeline, comments and controlled attachments.
3. Add US3: alert inbox, e-mail queue and due-date scan.
4. Add US4: archive and archived consultation.
5. Complete Infrastructure and Libs.
6. Complete Integration and Polish.

### Acceptance Gate

Before implementation is considered complete, all Core Route Handlers must exist (T037 full, T038, T049, T050, T062 full, T067), tests in Phase 5 must pass with real assertions, and the final Constitution Check must confirm backend authorization, centralized workflow, audit logs, history preservation, attachment controls and useful notifications.
