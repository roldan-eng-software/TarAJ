# Implementation Guide

## Current Status

**Completed Work:**
- [x] Project structure and directory layout
- [x] TypeScript configuration with path aliases
- [x] Tailwind CSS and styling setup
- [x] Test infrastructure (Vitest, test files)
- [x] Core domain types and interfaces
- [x] RBAC service with permission matrix
- [x] Authentication service stubs
- [x] History service (append-only)
- [x] Audit service (immutable logging)
- [x] Workflow state machine
- [x] Firebase configuration files
- [x] Security rules (Firestore & Storage)
- [x] README and documentation

**In Progress / TODO:**
- [ ] Complete Route Handler implementations
- [ ] Task service full implementation
- [ ] Notification and email service
- [ ] Comment and attachment services
- [ ] React component implementations
- [ ] Integration tests
- [ ] End-to-end testing

## Architecture Overview

### Layered Design

```
┌─────────────────────────────────────┐
│   UI Components (React)              │
│   app/(private)/ & components/       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Route Handlers (HTTP API)          │
│   app/api/                           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Domain Services (Business Logic)   │
│   src/domain/                        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Data Layer (Firebase)              │
│   Firestore & Cloud Storage          │
└─────────────────────────────────────┘
```

### Key Design Principles

1. **Server-Side Authorization**: All RBAC checks happen in Route Handlers or domain services, never trusting client state
2. **Append-Only History**: Task history is immutable, creating new records instead of updating
3. **Audit Trail**: Every critical operation is logged with actor, timestamp, and result
4. **Workflow Centralization**: All state transitions go through workflow service for validation
5. **Permission-Based Access**: Firestore Rules enforce permissions at data layer

## Completing the Implementation

### Phase 3: Core Implementation (T025-T072)

#### US1: Task Management (T025-T044)

**Services Completed:**
- `RBAC Service` - Permission matrix and access checks ✓
- `Auth Service` - Session verification ✓
- `History Service` - Append-only history ✓
- `Audit Service` - Immutable logging ✓
- `Workflow Service` - State machine ✓
- `Task Validation` - Input validation ✓
- `Task Service` - CRUD operations (stub, needs full implementation)

**Services TODO:**
- **Task Service** (complete): Add full CRUD with side effects, history recording, notification triggers
- **Firestore Converters**: Data type converters for safe serialization
- **UI Components**: KanbanBoard, TaskCard, TaskForm, TaskDetail, etc.

**Route Handlers TODO:**
- `POST /api/tasks` - Create task with history/audit
- `GET /api/tasks` - List with filtering and permission scoping
- `GET /api/tasks/[taskId]` - Get detail with subcollections
- `PUT /api/tasks/[taskId]` - Update with change tracking
- `POST /api/tasks/[taskId]/transitions` - Move task with validation

**Next Steps for US1:**
1. Implement full Task Service with:
   - Side effect triggering (history, audit, notifications)
   - Permission scoping in queries
   - Transaction safety for complex updates
2. Implement Route Handlers with proper:
   - Session extraction and validation
   - Request/response type safety
   - Error handling and HTTP status codes
   - Audit logging for all operations
3. Implement UI Components:
   - KanbanBoard with drag-and-drop
   - TaskCard with summary info
   - TaskForm for creation/editing
   - TaskDetail page with timeline

#### US2: History, Comments, Attachments (T045-T056)

**Services TODO:**
- `History Query Service` - Timeline aggregation
- `Comment Service` - @mention extraction, storage
- `Attachment Service` - Storage path management, metadata

**Components TODO:**
- `TaskTimeline` - Chronological event display
- `TaskComments` - Comment composer and list
- `TaskAttachments` - Upload/download UI

#### US3: Notifications (T057-T065)

**Services TODO:**
- `Notification Service` - Alert creation and deduplication
- `Email Queue Service` - Email scheduling
- `Due Date Service` - Upcoming/overdue scanning

**Components TODO:**
- `AlertInbox` - Alert list and marking as read

#### US4: Archiving (T066-T072)

**Services TODO:**
- Extend `Workflow Service` with archive/restore rules
- `Archive Query Service` - Archived task queries

**Components TODO:**
- `ArchiveActions` - Archive/restore controls
- Archive page with search/filter

### Phase 4: Integration (T073-T079)

Run and fix tests:
- Unit tests for all services
- Contract tests for Route Handlers
- Integration tests for complete workflows

### Phase 5: Polish (T080-T086)

- UI/UX refinements
- Accessibility improvements
- Performance optimization
- Documentation updates

## Code Patterns

### Service Pattern

```typescript
// All services follow this pattern:

import { assertCan } from '@/src/domain/rbac/rbac-service';
import type { SessionUser } from '@/src/types/domain';

export async function doSomething(
  input: SomeInput,
  actor: SessionUser
): Promise<Result> {
  // 1. Check permissions
  assertCan(actor, 'action', 'resource');

  // 2. Validate input
  const validated = validateInput(input);

  // 3. Execute business logic in transaction
  // 4. Record history/audit as side effects
  // 5. Trigger notifications
  // 6. Return result
}
```

### Route Handler Pattern

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and verify session
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse and validate request
    const body = await request.json();
    const validated = validateInput(body);

    // 3. Call domain service
    const result = await serviceFn(validated, session);

    // 4. Return response
    return NextResponse.json(result);
  } catch (error) {
    // 5. Log and return error
    logError(error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
```

## Testing Strategy

### Unit Tests
Test individual services in isolation with mocked Firebase/Firestore.

### Contract Tests
Test Route Handler contracts - input validation, permission checks, response format.

### Integration Tests
Test complete workflows with real Firestore emulator.

## Common Gotchas

1. **Firestore Transactions**: Use transactions for multi-document updates to ensure consistency
2. **Security Rules**: Remember that Rules are evaluated ON Firebase, Route Handlers are defense-in-depth
3. **History Recording**: Always record history as part of the same transaction as the task update
4. **Audit Logs**: Must be append-only - never update or delete audit records
5. **Permissions**: Check permissions at Route Handler level, then again at service level

## Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/database/admin/get-started)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
