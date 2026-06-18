<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles: template placeholders -> Privacidade e Autorizacao por Padrao;
Auditoria Obrigatoria; Workflow Centralizado; Historico Preservado;
Simplicidade Operacional e Notificacoes Uteis
Added sections: Escopo e Modelo Funcional; Desenvolvimento e Qualidade
Removed sections: Nenhuma secao concreta removida; placeholders do template substituidos
Templates requiring updates:
- updated: .specify/templates/plan-template.md
- updated: .specify/templates/spec-template.md
- updated: .specify/templates/tasks-template.md
- not present: .specify/templates/commands/*.md
- reviewed: AGENTS.md
Follow-up TODOs: Nenhum
-->
# TarAJ Constitution

## Core Principles

### I. Privacidade e Autorizacao por Padrao

Todos os dados do TarAJ MUST ser tratados como internos e sensiveis. O sistema
MUST exigir autenticacao para qualquer rota privada e autorizacao no backend
para qualquer leitura, escrita, anexo, historico, alerta ou acao administrativa.
Usuarios MUST ver e executar apenas o necessario para seu papel. Regras criticas
MUST NOT depender apenas do frontend.

Rationale: o sistema acompanha tarefas juridicas internas; uma falha de acesso
expoe informacao sensivel e compromete a confianca operacional.

### II. Auditoria Obrigatoria

Toda acao relevante MUST gerar log de auditoria imutavel para uso operacional e
consulta futura. Cada evento MUST registrar usuario, papel, acao, recurso
afetado, identificador do item e data/hora. Eventos criticos incluem login,
falha de login, criacao e edicao de tarefa, mudanca de estagio, alteracao de
responsavel, comentario, anexo, arquivamento, restauracao e alteracao de
permissoes.

Rationale: tarefas juridicas exigem rastreabilidade completa para explicar quem
fez o que, quando e em qual contexto.

### III. Workflow Centralizado

Toda mudanca de estagio, responsavel, arquivamento ou restauracao MUST passar
por uma unica camada de regra de negocio no backend. Essa camada MUST validar
permissao, transicao permitida, campos obrigatorios, comentario exigido quando
aplicavel, historico, auditoria e alertas. O frontend MAY orientar a experiencia,
mas MUST NOT ser a autoridade de permissao ou transicao.

Rationale: regras duplicadas entre telas geram divergencia, buracos de seguranca
e historico incompleto.

### IV. Historico Preservado

O historico de tarefas MUST ser preservado como parte essencial do sistema.
Tarefas concluidas MUST ser arquivadas para consulta, nao apagadas. Exclusao de
historico critico, anexos ou logs MUST ser restrita a rotinas administrativas
documentadas, autorizadas e auditadas. Restauracoes MUST registrar o motivo e o
responsavel.

Rationale: o valor do TarAJ esta tanto no estado atual do Kanban quanto na
memoria confiavel das movimentacoes.

### V. Simplicidade Operacional e Notificacoes Uteis

A interface MUST ser clara para usuarios nao tecnicos e otimizada para o uso
diario de cerca de 20 usuarios internos. Fluxos MUST reduzir ambiguidade, evitar
passos desnecessarios e manter busca, filtros e leitura do Kanban previsiveis.
Alertas MUST ser objetivos, deduplicados quando apropriado e informar o que
mudou, em qual tarefa, por quem e quando.

Rationale: uma ferramenta interna so sera adotada se reduzir atrito sem esconder
informacao importante.

## Escopo e Modelo Funcional

O TarAJ e um sistema web privado, interno e nao comercial para acompanhamento de
tarefas juridicas em fluxo Kanban. O MVP MUST suportar autenticacao de usuarios
autorizados, tarefas juridicas, colunas Kanban, movimentacao entre estagios,
historico, comentarios, anexos, observacoes internas, alertas, arquivamento,
busca e filtros operacionais.

O modelo minimo MUST considerar Usuario, Papel, Permissao, Tarefa juridica,
Coluna Kanban, Historico de movimentacao, Comentario, Anexo, Alerta, Log de
auditoria, Arquivamento e Tag ou categoria. Tarefas MUST registrar, no minimo:
identificador, codigo de referencia, titulo, descricao, categoria, prioridade,
estagio atual, responsavel principal, participantes, criador, data de criacao,
prazo, nivel de sigilo, observacoes internas, data de conclusao e data de
arquivamento quando aplicaveis.

O fluxo inicial SHOULD ser parametrizavel e MUST iniciar com Entrada, Em
analise, Aguardando documentos, Em andamento, Em revisao, Concluida e
Arquivada. Toda transicao MUST registrar historico; transicoes configuradas como
criticas MUST exigir comentario; Arquivada MUST receber apenas itens concluidos
ou encerrados por regra administrativa.

Papeis iniciais MUST incluir Administrador, Coordenador, Colaborador e Leitor ou
auditor interno. Permissoes MUST ser simples, revisaveis e aplicadas no backend.

## Desenvolvimento e Qualidade

Implementacoes MUST manter codigo tipado, modular e legivel. Cada feature que
altere dados sensiveis, permissoes, workflow, historico, anexos ou alertas MUST
incluir validacoes backend e testes capazes de demonstrar o comportamento
critico. Testes de contrato ou integracao MUST cobrir caminhos de autorizacao,
transicoes de workflow, auditoria e preservacao de historico sempre que a
feature tocar esses dominios.

Especificacoes e planos MUST declarar impacto em privacidade, autorizacao,
auditoria, workflow, historico, notificacoes e operacao diaria. Tarefas de
implementacao MUST incluir itens explicitos para seguranca, auditoria e
validacao de regras quando a feature afetar esses principios.

## Governance

Esta constituicao prevalece sobre praticas, templates e decisoes tecnicas
conflitantes do projeto. Mudancas em principios, escopo obrigatorio ou
governanca MUST ser documentadas na constituicao, refletidas nos templates
dependentes e acompanhadas por justificativa de versao.

Versao semantica:

- MAJOR: remocao ou redefinicao incompatibilizante de principios ou governanca.
- MINOR: novo principio, nova secao obrigatoria ou expansao material de regras.
- PATCH: clarificacao, correcao textual ou refinamento sem mudanca semantica.

Cada plano de feature MUST passar pelo Constitution Check antes da pesquisa e
novamente apos o desenho. Cada revisao de implementacao MUST verificar que
autorizacao backend, auditoria, workflow centralizado, historico preservado e
notificacoes foram tratados quando relevantes. Excecoes MUST ser registradas no
plano com motivo, alternativa simples rejeitada e risco residual.

**Version**: 1.0.0 | **Ratified**: 2026-06-18 | **Last Amended**: 2026-06-18
