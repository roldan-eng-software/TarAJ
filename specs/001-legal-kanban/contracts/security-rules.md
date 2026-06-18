# Firestore and Storage Security Rules Contract

This document defines required behavior for Firebase security rules. Exact rule
syntax belongs to implementation, but the behavior below is mandatory.

## Global Principles

- Deny by default.
- Require authentication for every Firestore and Storage read/write.
- Treat server-side domain services as the only trusted writer for audit,
  history, alerts and controlled workflow changes.
- Do not allow users to escalate roles, permissions, responsible assignments or
  workflow state through direct client writes.

## Firestore Collections

### users

Allowed:

- User can read their own active profile.
- Administrator can read and manage profiles.

Denied:

- Non-admin role/permission/status changes.
- User self-assignment of role or permissions.

### roles

Allowed:

- Authenticated users may read active role labels needed for UI.
- Administrators may manage roles/permissions.

Denied:

- Non-admin writes.

### tasks

Allowed:

- Authenticated users can read tasks allowed by role/scope.
- Authorized users can create/update through permitted fields when routed via
  server-side flows.

Denied:

- Anonymous reads/writes.
- Direct client writes to stage/archive fields outside controlled flow.
- Reads of restricted tasks by users outside permitted scope.

### tasks/{taskId}/history

Allowed:

- Users with task read permission can read visible history.
- Trusted server-side context writes history events.

Denied:

- Direct client create/update/delete.
- Ordinary deletion.

### tasks/{taskId}/comments

Allowed:

- Users with task read permission can read comments.
- Users with task comment permission can create comments.

Denied:

- Commenting on tasks outside user scope.
- Editing/removing comments without explicit administrative rule.

### tasks/{taskId}/attachments

Allowed:

- Users with task read permission can read attachment metadata.
- Users with attach permission can create metadata through controlled flow.

Denied:

- Metadata for a storage path outside the task's attachment namespace.
- Direct deletion without administrative audit flow.

### alerts

Allowed:

- Users can read and mark their own alerts as read.
- Administrators may inspect alerts for support/audit when authorized.

Denied:

- Users reading another user's alerts.
- Client creating arbitrary alerts.

### auditLogs

Allowed:

- Administrators and authorized audit readers may query audit logs.
- Trusted server-side context may create logs.

Denied:

- Client create/update/delete.
- Non-audit readers.

## Storage Paths

Required path convention:

```text
tasks/{taskId}/attachments/{attachmentId}/{fileName}
```

Allowed:

- Upload only when the user has attach permission for the task and the matching
  Firestore attachment intent/metadata exists or is being completed.
- Download only when the user has read permission for the task.

Denied:

- Anonymous access.
- Access to files outside task-scoped attachment paths.
- Access to attachments for tasks the user cannot read.
- Overwrite/delete without administrative audited flow.

## Acceptance Checks

- Anonymous Firestore and Storage operations fail.
- Internal Reader cannot mutate tasks/comments/attachments.
- Collaborator cannot access unrelated restricted task attachment.
- Direct write to `auditLogs` and `history` from client fails.
- Attempted role escalation by editing own user document fails.
