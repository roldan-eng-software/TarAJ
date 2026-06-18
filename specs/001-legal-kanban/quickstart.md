# Quickstart Validation: Sistema Kanban Jurídico Interno

This guide validates the planned MVP end-to-end after implementation.

## Prerequisites

- Firebase project configured with Authentication, Firestore and Storage.
- Vercel/local environment variables configured for Firebase client and
  server-side Admin access.
- Seeded internal users:
  - one Administrator
  - one Coordinator
  - one Collaborator
  - one Internal Reader
- Initial workflow stages seeded:
  Entrada, Em análise, Aguardando documentos, Em andamento, Em revisão,
  Concluída, Arquivada.

## Setup Commands

```bash
npm install
npm run dev
```

Expected:

- App starts locally.
- Private routes redirect or block unauthenticated access.

## Validation Scenarios

### 1. Authentication and RBAC

1. Open the app without signing in.
2. Attempt to access the Kanban route.
3. Sign in as each seeded role.
4. Confirm each role sees only allowed navigation/actions.

Expected:

- Unauthenticated access is blocked.
- Internal Reader cannot create, edit, move, comment, attach or archive.
- Administrator can access user/admin/audit areas.

### 2. Create and Move Task

1. Sign in as Coordinator.
2. Create a task with title, description, priority, responsible user and due
   date.
3. Confirm the task appears in Entrada.
4. Move it to Em análise.

Expected:

- Task appears in the new column.
- Task history records creation and movement.
- Audit log records both critical events.
- Relevant alerts are created.

### 3. Unauthorized Transition

1. Sign in as a user without move permission for the task.
2. Attempt to move the task to another stage.

Expected:

- Operation is blocked.
- Task remains in original stage.
- Denied event is auditable.

### 4. Comments, Mentions and Attachments

1. Sign in as authorized Collaborator.
2. Add a comment with a mention.
3. Upload an attachment.
4. Sign in as a user without task access and attempt to access the attachment.

Expected:

- Comment appears with author/date.
- Mentioned authorized user receives alert.
- Attachment metadata appears in the task.
- Unauthorized attachment access is denied.
- History and audit records are present.

### 5. Due Date Alerts

1. Create a task with due date inside the configured upcoming threshold.
2. Run or wait for the due-date scan.
3. Create or adjust a task to become overdue.

Expected:

- Upcoming and overdue alerts are created for correct recipients.
- Duplicate alerts are not created for the same recipient/event.

### 6. Complete, Archive and Query Archived

1. Move a task to Concluída.
2. Archive the task as an authorized user.
3. Confirm it leaves active Kanban.
4. Open archived task search/filter and locate it.

Expected:

- Archived task is retrievable.
- Full authorized history remains visible.
- Task is not deleted.

### 7. Security Rules Smoke Test

1. Attempt anonymous Firestore read/write.
2. Attempt direct write to task history or audit logs from client context.
3. Attempt role escalation by editing own user profile.
4. Attempt Storage read for another task's attachment.

Expected:

- All unauthorized operations fail.
- Legitimate server-side flows still pass.

## Reference Documents

- [data-model.md](./data-model.md)
- [contracts/route-handlers.md](./contracts/route-handlers.md)
- [contracts/domain-services.md](./contracts/domain-services.md)
- [contracts/security-rules.md](./contracts/security-rules.md)
