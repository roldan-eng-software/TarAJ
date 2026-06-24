# Implementation Guide

## Current Status

**MVP: COMPLETE** — All four user stories implemented and tested.

The project is ~90% complete. Remaining work consists of security hardening,
audit UI, and minor polish. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)
for details.

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

1. **Server-Side Authorization**: All RBAC checks happen in Route Handlers or
   domain services, never trusting client state.
2. **Append-Only History**: Task history is immutable — new records only.
3. **Audit Trail**: Every critical operation is logged with actor, timestamp,
   and result.
4. **Workflow Centralization**: All state transitions go through workflow
   service for validation.
5. **Permission-Based Access**: Firestore Rules provide defense-in-depth.

## Code Patterns

### Service Pattern

```typescript
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

  // 3. Execute business logic
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
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse and validate request
    const body = await request.json();
    const validated = validateInput(body);

    // 3. Call domain service
    const result = await serviceFn(validated, session);

    // 4. Return response
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
```

## Project Structure

```
app/
├── (auth)/login/           # Public login page
├── (private)/              # Protected routes
│   ├── kanban/             # Kanban board
│   ├── tasks/[taskId]/     # Task detail
│   ├── alerts/             # Alert inbox
│   ├── archive/            # Archived tasks
│   ├── settings/           # Password change
│   └── admin/              # Users, categories, alerts config
└── api/                    # Route Handlers
    ├── auth/session/
    ├── tasks/
    ├── alerts/
    ├── users/
    ├── categories/
    ├── admin/
    │   ├── users/
    │   ├── categories/
    │   ├── alert-config/
    │   └── email-jobs/
    └── cron/
        ├── due-date-check/
        ├── process-emails/
        └── cleanup/

src/
├── domain/                 # Business logic
│   ├── rbac/               # Role permission matrix
│   ├── auth/               # Session + user management
│   ├── tasks/              # Task CRUD + archive queries
│   ├── workflow/           # State machine + archive events
│   ├── history/            # Append-only history
│   ├── audit/              # Immutable audit logging
│   ├── notifications/      # Alerts, email, due-date scan
│   ├── comments/           # Comment service
│   ├── attachments/        # Attachment service (Vercel Blob)
│   └── categories/         # Category CRUD
├── firebase/               # Client/Admin SDK + converters
├── lib/                    # Validation, errors, dates
└── types/                  # TypeScript type definitions

components/
├── ui/                     # StateViews (loading, error, empty)
├── kanban/                 # KanbanBoard, TaskCard
├── tasks/                  # TaskForm, TaskComments, TaskAttachments,
│                           # TaskTimeline, ArchiveActions
├── alerts/                 # AlertInbox, AlertBadge
└── audit/                  # (stub — pending implementation)

tests/
├── unit/                   # Service-level tests
├── contract/               # API contract tests
└── integration/            # End-to-end workflow tests
```

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm test             # Run all tests
npm run lint         # Check linting
npm run format       # Format code with Prettier
npm run type-check   # TypeScript check (tsc --noEmit)
npm run seed         # Seed initial database data
```

## Testing Strategy

- **Unit tests** (`tests/unit/`): Test services in isolation with mocked
  Firebase. Cover RBAC, workflow, history, notifications, archive.
- **Contract tests** (`tests/contract/`): Test Route Handler contracts —
  input validation, permission checks, response format.
- **Integration tests** (`tests/integration/`): Test complete workflows with
  mocked Firestore.

## Environment Variables

See `.env.example` for all required variables:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase client SDK config
- `FIREBASE_*` — Firebase Admin SDK credentials
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage token
- `EMAIL_*` — SMTP email configuration
- `CRON_SECRET` — Secret for cron job authorization

## Common Gotchas

1. **Firestore Transactions**: Use transactions for multi-document updates.
2. **Security Rules**: Rules are defense-in-depth — primary auth is server-side.
3. **History Recording**: Record history in same transaction as task update.
4. **Audit Logs**: Append-only — never update or delete audit records.
5. **Permissions**: Check at Route Handler level, then again at service level.

## Known Technical Debt

1. `canAccessTask` in Firestore rules may be too restrictive for coordinators.
2. Tests duplicate transition/RBAC matrices locally.
3. `history-query-service.ts` references `createdBy` instead of `actor`.

## Resources

- [Specification](./specs/001-legal-kanban/spec.md)
- [Data Model](./specs/001-legal-kanban/data-model.md)
- [Route Handler Contracts](./specs/001-legal-kanban/contracts/route-handlers.md)
- [Domain Service Contracts](./specs/001-legal-kanban/contracts/domain-services.md)
- [Security Rules](./specs/001-legal-kanban/contracts/security-rules.md)
