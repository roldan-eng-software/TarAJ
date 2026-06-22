# Feature Specification: Sistema Kanban Jurídico Interno

**Feature Branch**: `001-legal-kanban`

**Created**: 2026-06-18

**Status**: Implemented

**Input**: User description: "Criar um sistema web privado, interno e não comercial para acompanhamento de tarefas jurídicas de uma associação religiosa em fluxo Kanban. O sistema será usado por cerca de 20 pessoas autenticadas. O objetivo é permitir que tarefas jurídicas sejam criadas, acompanhadas, movidas entre estágios definidos, comentadas, anexadas, concluídas e arquivadas para referência futura. O sistema deve registrar histórico completo de cada tarefa e gerar alertas automáticos sempre que houver eventos importantes, como criação de tarefa, mudança de responsável, mudança de estágio, prazo próximo, prazo vencido, conclusão, arquivamento e retorno para estágio anterior. Os usuários terão papéis diferentes, com permissões distintas, como administrador, coordenador, colaborador e leitor interno. O sistema deve ser simples de usar, com linguagem visual sóbria, boa rastreabilidade e foco em segurança, privacidade e auditoria. O fluxo inicial do Kanban deve considerar: Entrada, Em análise, Aguardando documentos, Em andamento, Em revisão, Concluída e Arquivada. O MVP deve incluir autenticação de usuários, controle por papéis, quadro Kanban com movimentação de tarefas, histórico por tarefa, comentários e anexos, alertas internos e por e-mail, arquivamento e consulta de arquivados, filtros básicos, trilha de auditoria para eventos críticos. O sistema deve priorizar clareza operacional, preservação de histórico, menor privilégio e notificações úteis sem excesso."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerenciar tarefas no Kanban (Priority: P1)

Como coordenador ou colaborador autorizado, quero criar tarefas jurídicas,
acompanhar seu estágio no quadro Kanban e movê-las conforme o andamento do
trabalho, para que a equipe tenha uma visão operacional clara do que precisa ser
feito, do que está em análise e do que foi concluído.

**Why this priority**: O quadro Kanban é o fluxo principal de trabalho; sem ele
o sistema não entrega o valor mínimo de acompanhamento diário.

**Independent Test**: Um usuário autorizado cria uma tarefa, visualiza-a em
Entrada, move-a por estágios permitidos até Concluída e confirma que cada
movimentação aparece no histórico da tarefa.

**Acceptance Scenarios**:

1. **Given** um coordenador autenticado, **When** ele cria uma tarefa com título,
   descrição, prioridade, responsável e prazo, **Then** a tarefa aparece na
   coluna Entrada com os dados principais visíveis.
2. **Given** uma tarefa em Entrada e um usuário autorizado, **When** o usuário a
   move para Em análise, **Then** a tarefa aparece na nova coluna e o histórico
   registra usuário, data, estágio anterior e novo estágio.
3. **Given** uma tarefa em qualquer estágio ativo, **When** um usuário sem
   permissão tenta movê-la, **Then** a movimentação é bloqueada e a tarefa
   permanece no estágio original.

---

### User Story 2 - Preservar histórico, comentários e anexos (Priority: P2)

Como membro autorizado da equipe, quero consultar o histórico completo de uma
tarefa, adicionar comentários e anexos, para que decisões, documentos e
movimentações permaneçam rastreáveis para referência futura.

**Why this priority**: Tarefas jurídicas dependem de contexto acumulado; perder
comentários, anexos ou histórico reduz a confiabilidade do acompanhamento.

**Independent Test**: Um usuário autorizado adiciona comentário e anexo a uma
tarefa, consulta a linha do tempo e confirma que criação, alterações,
movimentações, comentário e anexo aparecem em ordem cronológica.

**Acceptance Scenarios**:

1. **Given** uma tarefa existente, **When** um colaborador autorizado adiciona um
   comentário, **Then** o comentário aparece na tarefa com autor e data.
2. **Given** uma tarefa existente, **When** um colaborador autorizado adiciona um
   anexo, **Then** o anexo fica disponível apenas para usuários com permissão de
   acesso à tarefa.
3. **Given** uma tarefa com eventos anteriores, **When** um usuário autorizado
   abre o histórico, **Then** o sistema mostra todos os eventos relevantes em
   ordem cronológica.

---

### User Story 3 - Receber alertas úteis (Priority: P3)

Como usuário envolvido em tarefas jurídicas, quero receber alertas internos e
por e-mail sobre eventos importantes, para agir no momento certo sem precisar
verificar manualmente o quadro o tempo todo.

**Why this priority**: Alertas reduzem risco de perda de prazo e aumentam a
coordenação, mas dependem das tarefas e eventos já existirem.

**Independent Test**: Uma tarefa é criada, reatribuída, movida, aproximada do
prazo, vencida, concluída, arquivada e retornada a estágio anterior; em cada
evento relevante, os destinatários corretos recebem alerta com contexto
suficiente e sem duplicidade indevida.

**Acceptance Scenarios**:

1. **Given** uma tarefa atribuída a um responsável, **When** o responsável muda,
   **Then** o novo responsável recebe alerta informando tarefa, alteração, autor
   da mudança e data.
2. **Given** uma tarefa com prazo próximo ou vencido, **When** a condição de
   prazo é atingida, **Then** os usuários responsáveis recebem alerta objetivo
   com a identificação da tarefa e a situação do prazo.
3. **Given** uma tarefa movida para estágio anterior, **When** a movimentação é
   confirmada, **Then** os interessados recebem alerta destacando o retorno e o
   estágio anterior.

---

### User Story 4 - Arquivar e consultar tarefas concluídas (Priority: P4)

Como administrador, coordenador ou leitor interno autorizado, quero arquivar
tarefas concluídas e consultar tarefas arquivadas, para manter o quadro ativo
limpo sem perder memória institucional.

**Why this priority**: O arquivamento mantém o uso diário organizado e preserva
referências futuras, mas pode ser entregue depois do fluxo principal e dos
alertas essenciais.

**Independent Test**: Um usuário autorizado arquiva uma tarefa concluída,
confirma que ela sai do quadro ativo, encontra a tarefa nos arquivados por
filtro ou busca e consulta seu histórico completo.

**Acceptance Scenarios**:

1. **Given** uma tarefa Concluída, **When** um usuário autorizado a arquiva,
   **Then** ela deixa o quadro ativo e passa a aparecer na consulta de
   arquivados.
2. **Given** uma tarefa ainda não concluída, **When** um usuário tenta arquivá-la
   sem regra administrativa válida, **Then** o arquivamento é bloqueado.
3. **Given** uma tarefa arquivada, **When** um leitor autorizado a consulta,
   **Then** ele vê dados, comentários, anexos permitidos, histórico e auditoria
   aplicável sem poder alterar a tarefa.

### Edge Cases

- Usuário autenticado tenta acessar tarefa, anexo, histórico ou alerta fora de
  seu papel permitido.
- Usuário tenta mover uma tarefa para estágio inexistente ou não permitido pelo
  fluxo atual.
- Usuário tenta arquivar tarefa que não está Concluída e não possui encerramento
  administrativo autorizado.
- Uma tarefa recebe vários eventos de alerta em curto intervalo e o sistema
  precisa evitar notificações repetidas sem esconder eventos críticos.
- O prazo de uma tarefa é alterado depois de um alerta de prazo próximo já ter
  sido gerado.
- Uma tarefa arquivada precisa ser consultada por busca ou filtro sem voltar
  automaticamente ao quadro ativo.
- Falha de envio de e-mail não pode impedir que o alerta interno seja registrado.
- Tentativas de login inválidas e alterações de permissão precisam permanecer
  rastreáveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restrict access to authenticated users only.
- **FR-002**: System MUST support the roles Administrator, Coordinator,
  Collaborator, and Internal Reader, each with distinct permissions.
- **FR-003**: System MUST enforce permissions before allowing any user to view,
  create, edit, move, comment, attach, archive, restore, or audit a task.
- **FR-004**: System MUST allow authorized users to create legal tasks with at
  least title, description, category, priority, responsible user, participants,
  due date, confidentiality level, and internal notes.
- **FR-005**: System MUST display active tasks in a Kanban board with the initial
  stages Entrada, Em análise, Aguardando documentos, Em andamento, Em revisão,
  Concluída, and Arquivada.
- **FR-006**: System MUST allow authorized movement of tasks between permitted
  Kanban stages and block unauthorized or invalid transitions.
- **FR-007**: System MUST record a complete chronological history for each task,
  including creation, edits, stage changes, responsible changes, comments,
  attachments, completion, archiving, restoration, and returns to previous
  stages.
- **FR-008**: System MUST allow authorized users to add comments to tasks and
  show comment author and timestamp.
- **FR-009**: System MUST allow authorized users to add and consult task
  attachments while respecting task access permissions.
- **FR-010**: System MUST generate internal alerts for task creation,
  responsible change, stage change, upcoming due date, overdue task, completion,
  archiving, mention in comment, and return to a previous stage.
- **FR-011**: System MUST send e-mail alerts for relevant events without relying
  on e-mail delivery as the only notification record.
- **FR-012**: System MUST make each alert identify what changed, the related
  task, who caused the event when applicable, when it happened, and the required
  recipient action when relevant.
- **FR-013**: System MUST avoid duplicate alert noise for the same recipient and
  same event while preserving the underlying event history.
- **FR-014**: System MUST allow authorized users to archive completed tasks and
  consult archived tasks separately from the active Kanban board.
- **FR-015**: System MUST prevent unrestricted deletion of critical task
  history, audit records, and archived references.
- **FR-016**: System MUST provide basic filters for operational use, including
  stage, responsible user, priority, due date status, category, archived status,
  and text search.
- **FR-017**: System MUST maintain an audit trail for critical events, including
  user, role, action, affected resource, item identifier, date, and time.
- **FR-018**: System MUST record login failures and permission changes in the
  audit trail.
- **FR-019**: System MUST provide read-only access for internal readers according
  to their permissions.
- **FR-020**: System MUST present a sober, clear visual language suitable for
  internal operational work by non-technical users.

### Key Entities *(include if feature involves data)*

- **User**: Authenticated person allowed to use the system; has identity,
  active status, role, and permissions.
- **Role**: Permission grouping such as Administrator, Coordinator,
  Collaborator, or Internal Reader.
- **Permission**: Specific allowance to view, create, edit, move, comment,
  attach, archive, restore, audit, or administer records.
- **Legal Task**: Work item tracked in the Kanban flow; includes reference code,
  title, description, category, priority, current stage, responsible user,
  participants, dates, confidentiality level, and internal notes.
- **Kanban Stage**: Defined workflow position for a task, initially Entrada, Em
  análise, Aguardando documentos, Em andamento, Em revisão, Concluída, and
  Arquivada.
- **Task History Event**: Chronological record of meaningful task activity,
  including actor, timestamp, event type, previous value, and new value when
  relevant.
- **Comment**: Internal note linked to a task, author, and timestamp.
- **Attachment**: File or document linked to a task and governed by the same
  access restrictions as the task.
- **Alert**: Notification record linked to an event, task, recipients, channel,
  read status, and timestamp.
- **Audit Log**: Protected record of critical system and security events.
- **Archive Record**: State and metadata showing when a task was archived,
  why, and by whom.

## Constitution Alignment *(mandatory)*

- **Privacy/Authorization**: All legal task data, comments, attachments,
  history, alerts, and audit entries are private internal records. Access is
  limited to authenticated users and governed by role-based permissions with
  least privilege.
- **Audit Events**: Login failures, permission changes, task creation, edits,
  movement, responsible changes, comments, attachments, completion, archiving,
  restoration, and returns to previous stages must be auditable with actor,
  role, resource, item identifier, date, and time.
- **Workflow Rules**: Stage changes, responsible changes, completion,
  archiving, restoration, and returns to previous stages must follow centralized
  business rules and cannot rely on visual board movement alone.
- **History Preservation**: Task history, archive records, comments,
  attachments, and audit logs must remain available for authorized consultation;
  unrestricted deletion is out of scope for the MVP.
- **Notifications**: Internal and e-mail alerts must cover the events listed in
  the requirements, identify the changed task and context, and avoid duplicate
  noise for the same recipient/event.
- **Operational Simplicity**: The experience must favor a sober Kanban view,
  clear labels, basic filters, readable history, and direct actions suited to
  about 20 internal non-technical users.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of pilot users can create, locate, move, and complete
  a task in the Kanban flow without assistance after one short orientation.
- **SC-002**: Authorized users can find an active or archived task by basic
  filters or text search in under 30 seconds during acceptance testing.
- **SC-003**: 100% of tested critical events produce a task history entry and an
  audit entry with actor, action, item identifier, date, and time.
- **SC-004**: 100% of unauthorized attempts in acceptance tests are blocked from
  viewing or changing protected task data.
- **SC-005**: 95% of relevant alert scenarios tested produce one clear internal
  alert for the correct recipients without duplicate alert records for the same
  event.
- **SC-006**: Archived tasks remain retrievable with complete authorized history
  in 100% of archive consultation tests.

## Assumptions

- The system is for internal, private, non-commercial use by approximately 20
  authenticated users.
- The MVP uses the initial role set: Administrator, Coordinator, Collaborator,
  and Internal Reader.
- The MVP uses the initial Kanban stages listed in the user request; future
  configuration of stages can be planned after the MVP.
- Alerts are delivered inside the system and by e-mail, with the internal alert
  record serving as the reliable notification history.
- Deleted or purged historical records are not part of ordinary user workflows
  in the MVP.
- Users are expected to access the system through a modern web browser with
  stable internet connectivity.
