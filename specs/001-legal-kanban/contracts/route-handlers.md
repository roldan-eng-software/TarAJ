# Internal Route Handler Contracts

All routes are private unless explicitly marked public. All private handlers
must verify authentication, load the internal user profile, enforce RBAC, call a
domain service, and return structured errors.

## Error Shape

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "requestId": "req_..."
  }
}
```

Common status mapping:

- `401`: unauthenticated
- `403`: authenticated but not authorized
- `404`: resource not visible or not found
- `409`: invalid workflow transition or conflicting state
- `422`: invalid input

## Auth

### POST /api/auth/session

Purpose: exchange/confirm Firebase identity for an application session/profile.

Request:

```json
{
  "idToken": "firebase-id-token"
}
```

Response:

```json
{
  "user": {
    "id": "user_123",
    "displayName": "Name",
    "email": "user@example.org",
    "role": "coordinator",
    "permissions": ["task:create"]
  }
}
```

## Tasks

### GET /api/tasks

Query:

- `stageId`
- `responsibleUserId`
- `priority`
- `dueStatus`
- `category`
- `archived`
- `q`

Response:

```json
{
  "tasks": [
    {
      "id": "task_123",
      "referenceCode": "JUR-2026-001",
      "title": "Analisar documento",
      "stageId": "entrada",
      "priority": "normal",
      "responsibleUserId": "user_123",
      "dueAt": "2026-06-25T12:00:00.000Z",
      "archived": false
    }
  ]
}
```

### POST /api/tasks

Creates a legal task.

Request:

```json
{
  "title": "Analisar documento",
  "description": "Descrição operacional",
  "category": "documentos",
  "priority": "normal",
  "responsibleUserId": "user_123",
  "participantUserIds": ["user_456"],
  "dueAt": "2026-06-25T12:00:00.000Z",
  "confidentialityLevel": "standard",
  "internalNotes": "Observação interna"
}
```

Response: `201` with task summary.

Side effects:

- task created
- history event `created`
- audit log
- internal/e-mail alerts as configured

### GET /api/tasks/{taskId}

Returns full task detail visible to the current user, including metadata and
summary counts for history/comments/attachments/alerts.

### PATCH /api/tasks/{taskId}

Updates editable task fields, excluding stage/archive transitions.

Side effects:

- history event `edited`
- audit log
- alerts when responsible user changes

### POST /api/tasks/{taskId}/transitions

Request:

```json
{
  "targetStageId": "em-analise",
  "comment": "Motivo quando exigido"
}
```

Response:

```json
{
  "taskId": "task_123",
  "previousStageId": "entrada",
  "stageId": "em-analise",
  "historyId": "history_123"
}
```

Side effects:

- workflow validation
- task stage update
- history event
- audit log
- alerts for stage change or backward transition

### POST /api/tasks/{taskId}/archive

Archives a completed or administratively closed task.

### POST /api/tasks/{taskId}/restore

Restores an archived task to an allowed non-archived state. Administrator or
authorized coordinator only.

## Comments

### GET /api/tasks/{taskId}/comments

Returns comments visible to the current user.

### POST /api/tasks/{taskId}/comments

Request:

```json
{
  "body": "Comentário interno com @menção",
  "mentionedUserIds": ["user_456"]
}
```

Side effects:

- comment created
- history event `comment_added`
- audit log
- mention alerts

## Attachments

### POST /api/tasks/{taskId}/attachments/upload-request

Creates an authorized upload intent/path for a task attachment.

Request:

```json
{
  "fileName": "documento.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 123456
}
```

Response:

```json
{
  "attachmentId": "attachment_123",
  "storagePath": "tasks/task_123/attachments/attachment_123/documento.pdf",
  "uploadMode": "controlled"
}
```

### POST /api/tasks/{taskId}/attachments/{attachmentId}/complete

Confirms metadata after upload and records history/audit.

### GET /api/tasks/{taskId}/attachments/{attachmentId}/download

Returns an authorized download reference or redirects to a temporary access
mechanism chosen during implementation.

## Alerts

### GET /api/alerts

Returns current user's alerts, with optional `unreadOnly=true`.

### POST /api/alerts/{alertId}/read

Marks an alert as read for the current recipient.

## Admin

### GET /api/admin/audit-logs

Restricted to administrators/audit readers. Supports filtering by actor,
resource, item and date range.

### PATCH /api/admin/users/{userId}

Updates role/status/permissions and writes critical audit event.
