# Implementation Plan: Sistema Kanban Jurídico Interno

**Branch**: `001-legal-kanban` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-legal-kanban/spec.md`

## Summary

Implementar um sistema web privado para acompanhamento de tarefas jurídicas em
Kanban, com cerca de 20 usuários internos, RBAC, histórico preservado,
auditoria completa, anexos controlados e alertas internos/e-mail. A arquitetura
será um app Next.js + TypeScript em projeto único, com UI modular em Tailwind
CSS, Route Handlers como camada HTTP, serviços server-side para regras de
domínio, Firebase Authentication para identidade, Cloud Firestore para dados,
Cloud Storage for Firebase para anexos e Vercel para deploy.

## Technical Context

**Language/Version**: TypeScript em Next.js App Router; Node.js runtime para
Route Handlers que verificam sessão, executam serviços de domínio e acessam
Firebase Admin.

**Primary Dependencies**: Next.js, React, TypeScript, Tailwind CSS,
Firebase JavaScript SDK, Firebase Admin SDK, Cloud Firestore, Cloud Storage for
Firebase, provedor de e-mail transacional a definir na implementação.

**Storage**: Cloud Firestore para dados operacionais/auditoria/alertas; Cloud
Storage for Firebase para anexos com metadados controlados no Firestore.

**Testing**: Testes unitários para serviços de domínio e RBAC; testes de
contrato para Route Handlers internos; testes de integração para fluxos Kanban,
auditoria, anexos, alertas e segurança.

**Target Platform**: Aplicação web privada em navegador moderno, deploy na
Vercel, com Firebase como backend gerenciado.

**Project Type**: Aplicação web full-stack em projeto único Next.js.

**Performance Goals**: Kanban e filtros devem responder de forma perceptível em
até 2 segundos para o volume esperado; busca/filtro deve localizar tarefas em
até 30 segundos para usuários durante aceite; alertas internos devem aparecer
em até 1 minuto após eventos críticos.

**Constraints**: Uso interno e não comercial; aproximadamente 20 usuários;
nenhuma regra crítica apenas no frontend; menor privilégio; histórico e
auditoria protegidos; anexos acessíveis apenas por usuários autorizados.

**Scale/Scope**: MVP com roles Administrador, Coordenador, Colaborador e Leitor
interno; fluxo inicial Entrada, Em análise, Aguardando documentos, Em
andamento, Em revisão, Concluída e Arquivada; alertas internos/e-mail para os
eventos definidos na spec.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Privacidade e autorizacao**: PASS. Dados tocados incluem tarefas,
  comentários, anexos, histórico, alertas e auditoria. Toda leitura/escrita
  passa por autenticação Firebase e autorização RBAC server-side antes de
  acessar Firestore/Storage. Firestore/Storage Rules reforçam menor privilégio.
- **Auditoria**: PASS. Eventos críticos geram `auditLogs` com actor, role,
  action, resource, itemId, timestamp, metadata e requestId. Falhas de login e
  alterações de permissão também são auditáveis.
- **Workflow centralizado**: PASS. Mudanças de estágio, responsável,
  arquivamento, restauração e retorno para estágio anterior passam por
  `workflowService`, que valida transição, permissão, histórico, auditoria e
  alertas.
- **Historico preservado**: PASS. `taskHistory` é append-only no uso normal;
  arquivamento altera estado e cria registro, sem excluir tarefa ou histórico.
  Exclusão irrestrita fica fora do MVP.
- **Notificacoes uteis**: PASS. `notificationService` gera alerta interno como
  fonte confiável e agenda e-mail quando aplicável, com chave de deduplicação
  por evento/destinatário.
- **Simplicidade operacional**: PASS. UI prioriza Kanban, filtros básicos,
  detalhe de tarefa em painel/modal, linguagem sóbria e componentes
  reutilizáveis.

## Project Structure

### Documentation (this feature)

```text
specs/001-legal-kanban/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── route-handlers.md
│   ├── domain-services.md
│   └── security-rules.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   └── login/
├── (private)/
│   ├── layout.tsx
│   ├── kanban/
│   ├── tasks/[taskId]/
│   ├── archive/
│   ├── alerts/
│   └── admin/
└── api/
    ├── tasks/
    ├── tasks/[taskId]/
    ├── tasks/[taskId]/comments/
    ├── tasks/[taskId]/attachments/
    ├── tasks/[taskId]/transitions/
    ├── alerts/
    └── admin/

components/
├── kanban/
├── tasks/
├── alerts/
├── audit/
└── ui/

src/
├── domain/
│   ├── auth/
│   ├── rbac/
│   ├── tasks/
│   ├── workflow/
│   ├── audit/
│   ├── notifications/
│   └── attachments/
├── firebase/
│   ├── client.ts
│   ├── admin.ts
│   └── converters/
├── lib/
│   ├── validation/
│   ├── errors/
│   └── dates/
└── types/

firebase/
├── firestore.rules
├── storage.rules
└── indexes.json

tests/
├── unit/
├── contract/
└── integration/
```

**Structure Decision**: Projeto único Next.js para reduzir complexidade no MVP.
O frontend fica em `app/` e `components/`; os Route Handlers ficam em
`app/api/`; regras críticas ficam em `src/domain/`; acesso Firebase fica
isolado em `src/firebase/`; regras declarativas de segurança ficam em
`firebase/`.

## Architecture

### Module Boundaries

- `app/(private)`: telas autenticadas; não contém decisões finais de permissão.
- `components/*`: componentes reutilizáveis, focados em apresentação e eventos
  de UI.
- `app/api/*`: valida sessão, chama serviços de domínio, traduz erros para
  respostas HTTP e nunca implementa regra de negócio complexa diretamente.
- `src/domain/rbac`: matriz de permissões, helpers `can(role, action, resource)`
  e validação por escopo de tarefa.
- `src/domain/workflow`: autoridade para transições de estágio, mudança de
  responsável, conclusão, arquivamento, restauração e retorno.
- `src/domain/audit`: criação append-only de logs críticos e enriquecimento com
  actor, role, requestId e metadados.
- `src/domain/notifications`: criação de alertas internos, deduplicação e fila
  de e-mail.
- `src/domain/attachments`: emissão de caminhos controlados, validação de
  metadados e vínculo obrigatório com tarefa.
- `src/firebase`: inicialização, Admin SDK server-side, converters tipados e
  acesso a Firestore/Storage.

### Request Flow

1. Usuário autenticado chama UI ou Route Handler.
2. Route Handler verifica Firebase ID token/session e carrega perfil interno.
3. Serviço RBAC valida ação, papel e escopo.
4. Serviço de domínio executa mutação em transação quando necessário.
5. Mutação grava documento principal, histórico, auditoria e alertas.
6. UI atualiza Kanban/detalhe e mostra feedback claro.

## RBAC Strategy

Roles iniciais:

- Administrador: gerencia usuários/permissões, consulta auditoria completa,
  configura parâmetros do fluxo, arquiva/restaura conforme regra.
- Coordenador: cria/edita tarefas, move estágios permitidos, reatribui
  responsáveis, consulta operação.
- Colaborador: vê tarefas permitidas, comenta, anexa, atualiza tarefas sob sua
  responsabilidade e move apenas transições autorizadas.
- Leitor interno: consulta tarefas, histórico e auditoria permitida sem alterar
  dados.

As permissões serão persistidas no perfil interno do usuário e avaliadas no
server-side. Custom claims do Firebase podem conter role/resumo para triagem,
mas o perfil no Firestore é a fonte revisável de permissões da aplicação.

## Firestore Data Model Overview

Coleções principais:

- `users/{userId}`
- `roles/{roleId}`
- `tasks/{taskId}`
- `tasks/{taskId}/history/{historyId}`
- `tasks/{taskId}/comments/{commentId}`
- `tasks/{taskId}/attachments/{attachmentId}`
- `alerts/{alertId}`
- `auditLogs/{auditId}`
- `workflowStages/{stageId}`
- `emailQueue/{emailJobId}`

Consultas esperadas:

- Kanban ativo por `archived == false` e `stageId`.
- Tarefas por responsável, prioridade, categoria e status de prazo.
- Arquivados por `archived == true`, texto/código e filtros básicos.
- Alertas por destinatário e `readAt == null`.
- Auditoria por recurso, item, actor e período.

## Audit Strategy

Auditoria é append-only por operação crítica. Cada log registra:

- `actorUserId`, `actorRole`, `action`, `resourceType`, `resourceId`
- `occurredAt`, `requestId`, `result`, `metadata`
- valores anteriores/novos quando necessário e seguro

Operações críticas chamam auditoria como parte do serviço de domínio. Falhas de
autorização e login falho também geram evento de segurança quando houver
identificador suficiente para rastreio.

## Notification Strategy

Alertas internos são a fonte confiável. E-mail é canal adicional. Cada evento de
notificação gera:

- alerta interno em `alerts`
- job de e-mail em `emailQueue`, quando o evento exige e-mail
- `dedupeKey` por `eventType + taskId + recipientId + eventVersion`

Eventos cobertos: criação de tarefa, mudança de responsável, mudança de
estágio, prazo próximo, prazo vencido, conclusão, arquivamento, comentário com
menção e retorno para estágio anterior.

## Firestore and Storage Security Rules

Rules devem negar por padrão. Leituras e escritas exigem `request.auth != null`.
Firestore Rules reforçam acesso por papel/escopo e bloqueiam escrita direta em
coleções sensíveis como `auditLogs` e `history`, que devem ser gravadas por
server-side trusted context. Storage Rules exigem caminho associado a tarefa e
permissão equivalente à tarefa; metadados do anexo no Firestore são a fonte para
consulta e auditoria.

## MVP Implementation Phases

1. Base do projeto: Next.js, TypeScript, Tailwind, Firebase client/admin,
   estrutura modular, variáveis de ambiente e layout privado.
2. Autenticação e RBAC: login, perfil interno, papéis, permissões, bloqueios de
   rota e helpers server-side.
3. Tarefas e Kanban: criação, listagem, filtros básicos, detalhe, movimento
   controlado e estágios iniciais.
4. Histórico e auditoria: histórico por tarefa, audit logs críticos e consulta
   autorizada.
5. Comentários e anexos: comentários, upload controlado, metadados, download
   autorizado e auditoria.
6. Alertas: alertas internos, leitura, deduplicação, e-mail e eventos de prazo.
7. Arquivamento: arquivar concluídas, consulta de arquivados e bloqueios de
   exclusão irrestrita.
8. Hardening e aceite: regras Firestore/Storage, testes de segurança, fluxos
   end-to-end e ajustes de usabilidade.

## Technical Risks and Architectural Decisions

- Firebase Auth + Firestore Rules não substituem RBAC server-side. Decisão:
  duplicar defesa com verificação em serviços e rules restritivas.
- Alertas de prazo precisam de rotina agendada. Decisão: modelar `emailQueue` e
  job de prazo como contrato interno; escolher mecanismo agendado na
  implementação conforme disponibilidade do deploy.
- Firestore não faz busca textual avançada nativamente. Decisão: MVP usa busca
  por código/título normalizado e filtros básicos; busca avançada fica fora do
  MVP.
- Anexos podem expor dados sensíveis. Decisão: caminhos por tarefa, metadados
  obrigatórios, regras restritivas e URLs temporárias/controle por permissão.
- Auditoria append-only aumenta volume. Decisão: aceitar volume por escala
  pequena e priorizar rastreabilidade.

## Technical Acceptance Criteria

- Todas as rotas privadas bloqueiam usuário não autenticado.
- Usuário sem permissão não consegue ler/mutar tarefa, anexo, histórico, alerta
  ou auditoria, mesmo por Route Handler.
- Toda mutação crítica cria histórico e audit log.
- Transições inválidas ou não autorizadas são bloqueadas por serviço server-side.
- Arquivamento não apaga tarefa, histórico, comentários, anexos ou auditoria.
- Alertas internos são gerados para os eventos definidos e e-mail não é a única
  trilha de notificação.
- Firestore/Storage Rules negam acesso anônimo e escrita direta indevida em
  dados sensíveis.
- UI permite operar o fluxo principal em desktop e mobile sem depender de
  treinamento técnico.

## Derived Artifacts

- [research.md](./research.md): decisões de stack e padrões.
- [data-model.md](./data-model.md): entidades, campos, relacionamentos,
  validações e estados.
- [contracts/route-handlers.md](./contracts/route-handlers.md): contratos dos
  Route Handlers internos.
- [contracts/domain-services.md](./contracts/domain-services.md): contratos dos
  serviços de domínio.
- [contracts/security-rules.md](./contracts/security-rules.md): contratos das
  regras Firestore/Storage.
- [quickstart.md](./quickstart.md): guia de validação end-to-end.

## Complexity Tracking

No constitution violations. No complexity waivers required.
