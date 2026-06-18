# Research: Sistema Kanban Jurídico Interno

## Decision: Next.js App Router with Route Handlers as HTTP boundary

**Rationale**: The app needs a private UI and server-side operations in one
deployable web project. Next.js Route Handlers support server-side request
handling, environment variables, and authentication/authorization checks before
business logic. Context7 documentation for Next.js shows Route Handlers
verifying session and role before continuing, returning 401/403 when needed.

**Alternatives considered**:

- Separate backend service: stronger isolation, but more operational overhead
  for a 20-user internal MVP.
- Client-only Firebase app: simpler initial UI, but violates the constitution
  because workflow, RBAC, audit and notifications would be too exposed to
  client-only enforcement.

**Source basis**:

- Context7 `/vercel/next.js`, authentication guide for Route Handlers.
- Context7 `/vercel/next.js`, environment variables guide.

## Decision: Firebase Authentication with server-side token verification

**Rationale**: Firebase Authentication fits the preferred stack and provides
identity for a private app. The client SDK handles sign-in state; server-side
Route Handlers verify the token/session before loading the internal user profile
and applying RBAC. Context7 documentation for Firebase JS SDK confirms modular
Auth APIs and demonstrates server-side ID token verification with Firebase Admin.

**Alternatives considered**:

- Custom username/password auth: unnecessary security burden for MVP.
- Vercel-only auth: simpler deploy integration, but not aligned with preferred
  Firebase stack.

**Source basis**:

- Context7 `/firebase/firebase-js-sdk`, Firebase Auth modular APIs.
- Context7 `/firebase/firebase-js-sdk`, server-side ID token verification
  example with Firebase Admin SDK.

## Decision: Cloud Firestore as operational datastore

**Rationale**: Firestore supports the document/subcollection shape needed for
tasks, history, comments, alerts and audit records. The MVP volume is small, and
Firestore queries can cover Kanban columns, responsible user, priority, due-date
status, archive status and alert inbox. Firestore writes that require consistency
will be grouped in domain services and transactions where needed.

**Alternatives considered**:

- Relational database: stronger joins and reporting, but not the preferred stack.
- Single collection with embedded arrays for everything: easier to start but
  poor for append-only history, comments, alerts and audit growth.

## Decision: Cloud Storage for Firebase for attachments

**Rationale**: Attachments need object storage rather than Firestore documents.
Storage paths will be scoped by task, while Firestore stores attachment metadata
for authorization, audit and display. Context7 documentation for Firebase JS SDK
shows Storage references built from explicit paths, which supports predictable
task-scoped organization.

**Alternatives considered**:

- Store attachments in Firestore: unsuitable for files and larger documents.
- Public object URLs: rejected because attachments are sensitive internal data.

## Decision: RBAC enforced in services and reinforced by Rules

**Rationale**: The constitution forbids critical rules only in the frontend.
RBAC must be enforced by server-side domain services before every protected
operation. Firestore and Storage Rules deny by default and provide a second
layer against accidental client-side access.

**Alternatives considered**:

- Custom claims only: fast checks, but harder to revise and not sufficient for
  task-level scope.
- Firestore Rules only: stronger than frontend-only, but business workflow and
  audit orchestration still need server-side domain services.

## Decision: Tailwind CSS as styling base with reusable components

**Rationale**: Tailwind CSS is the requested styling base. Current Tailwind docs
for Next.js use `@tailwindcss/postcss` and `@import "tailwindcss"`. Tailwind
generates static CSS by scanning templates and has zero runtime overhead, which
fits a simple internal UI. Reusable components will live in `components/` with
small semantic wrappers and consistent utility patterns.

**Alternatives considered**:

- Component library-first approach: faster at first, but can add visual weight
  and dependency churn for a sober internal tool.
- Custom CSS only: more flexible but less consistent and slower to adjust.

**Source basis**:

- Context7 `/tailwindlabs/tailwindcss.com`, Next.js installation guide.
- Context7 `/tailwindlabs/tailwindcss.com`, zero-runtime utility CSS model.

## Decision: Internal alerts as source of truth, e-mail as secondary channel

**Rationale**: E-mail delivery can fail or be delayed. The reliable notification
record must be an internal alert tied to the event, task and recipients. E-mail
jobs reference the internal alert. Deduplication prevents repeated noise for the
same recipient/event while preserving the full history and audit records.

**Alternatives considered**:

- E-mail-only notifications: rejected because users would lose system-level
  notification history.
- Real-time push-only notifications: useful later, unnecessary for MVP.

## Decision: Append-only history and audit records

**Rationale**: Legal task tracking depends on knowing who changed what and when.
Task history and audit logs are separate: history is user-facing task context;
audit is protected compliance/security trace. Both are append-only in ordinary
flows and protected from unrestricted deletion.

**Alternatives considered**:

- Single combined event log: simpler storage, but mixes user-facing history with
  security audit and complicates permissions.
- Mutable history rows: rejected because it undermines traceability.
