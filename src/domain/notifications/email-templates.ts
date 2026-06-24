function baseTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  .wrapper { max-width:600px; margin:24px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
  .header { background:#1e293b; padding:20px 24px; }
  .header h1 { margin:0; color:#ffffff; font-size:18px; font-weight:600; }
  .body { padding:24px; color:#334155; font-size:15px; line-height:1.6; }
  .footer { padding:16px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; text-align:center; }
  .btn { display:inline-block; padding:10px 20px; background:#0284c7; color:#ffffff !important; text-decoration:none; border-radius:6px; font-size:14px; font-weight:500; }
  .btn:hover { background:#0369a1; }
  .tag { display:inline-block; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; }
  .tag-sky { background:#e0f2fe; color:#0369a1; }
  .tag-emerald { background:#d1fae5; color:#059669; }
  .tag-amber { background:#fef3c7; color:#d97706; }
  .tag-red { background:#fee2e2; color:#dc2626; }
</style></head>
<body>
<div class="wrapper">
  <div class="header"><h1>Sistema Jurídico</h1></div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">
    <p>Este é um e-mail automático do Sistema Jurídico. Não responda a esta mensagem.</p>
    <p>&copy; ${new Date().getFullYear()} — Sistema Interno</p>
  </div>
</div>
</body>
</html>`;
}

function taskLine(title: string): string {
  return `Tarefa: <strong>${escapeHtml(title)}</strong>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface TemplateInput {
  taskTitle: string;
  actorName: string;
  taskId?: string;
  fromStage?: string;
  toStage?: string;
  dueDate?: string;
}

export function taskCreatedTemplate(input: TemplateInput): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Nova tarefa: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" foi criada por ${input.actorName}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Uma nova tarefa foi criada no sistema.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Criado por</td><td style="padding:6px 0"><span class="tag tag-sky">${escapeHtml(input.actorName)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function taskAssignedTemplate(input: TemplateInput): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Responsável alterado: ${input.taskTitle}`;
  const text = `Você foi designado responsável pela tarefa "${input.taskTitle}" por ${input.actorName}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Você foi designado como <strong>responsável</strong> por uma tarefa.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Designado por</td><td style="padding:6px 0"><span class="tag tag-sky">${escapeHtml(input.actorName)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function stageChangedTemplate(input: TemplateInput & { fromStage: string; toStage: string; backward: boolean }): { subject: string; text: string; html: string } {
  const direction = input.backward ? 'retornou para' : 'avançou para';
  const subject = `[TarAJ] Estágio alterado: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" ${direction} "${input.toStage}" por ${input.actorName}.`;
  const stageTag = input.backward ? 'tag-amber' : 'tag-emerald';
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>O estágio de uma tarefa foi alterado.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">De</td><td style="padding:6px 0"><span class="tag tag-sky">${escapeHtml(input.fromStage)}</span></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Para</td><td style="padding:6px 0"><span class="tag ${stageTag}">${escapeHtml(input.toStage)}</span></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Por</td><td style="padding:6px 0">${escapeHtml(input.actorName)}</td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function mentionTemplate(input: TemplateInput): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Menção: ${input.taskTitle}`;
  const text = `Você foi mencionado por ${input.actorName} na tarefa "${input.taskTitle}".`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Você foi <strong>mencionado</strong> em um comentário.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Mencionado por</td><td style="padding:6px 0"><span class="tag tag-sky">${escapeHtml(input.actorName)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver comentário</a></p>
  `);
  return { subject, text, html };
}

export function completedTemplate(input: TemplateInput): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Tarefa concluída: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" foi concluída por ${input.actorName}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Uma tarefa foi concluída.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Concluído por</td><td style="padding:6px 0"><span class="tag tag-emerald">${escapeHtml(input.actorName)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function archivedTemplate(input: TemplateInput): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Tarefa arquivada: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" foi arquivada por ${input.actorName}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Uma tarefa foi arquivada.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Arquivado por</td><td style="padding:6px 0"><span class="tag tag-sky">${escapeHtml(input.actorName)}</span></td></tr>
    </table>
  `);
  return { subject, text, html };
}

export function restoredTemplate(input: TemplateInput & { targetStage: string }): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Tarefa restaurada: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" foi restaurada para "${input.targetStage}" por ${input.actorName}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Uma tarefa foi restaurada para o estágio ativo.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Estágio</td><td style="padding:6px 0"><span class="tag tag-emerald">${escapeHtml(input.targetStage)}</span></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Por</td><td style="padding:6px 0">${escapeHtml(input.actorName)}</td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function dueDateUpcomingTemplate(input: TemplateInput & { dueDate: string }): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Prazo próximo: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" tem prazo próximo: ${input.dueDate}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>O prazo de uma tarefa está <strong>próximo do vencimento</strong>.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Prazo</td><td style="padding:6px 0"><span class="tag tag-amber">${escapeHtml(input.dueDate)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function dueDateOverdueTemplate(input: TemplateInput & { dueDate: string }): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Prazo vencido: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" está com prazo vencido: ${input.dueDate}.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>O prazo de uma tarefa está <strong>vencido</strong>.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Prazo</td><td style="padding:6px 0"><span class="tag tag-red">${escapeHtml(input.dueDate)}</span></td></tr>
    </table>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

export function inactivityAlertTemplate(input: TemplateInput & { daysInactive: number }): { subject: string; text: string; html: string } {
  const subject = `[TarAJ] Tarefa inativa: ${input.taskTitle}`;
  const text = `A tarefa "${input.taskTitle}" está sem movimentação há ${input.daysInactive} dias.`;
  const html = baseTemplate(`
    <p style="margin-top:0">Olá,</p>
    <p>Uma tarefa está <strong>sem movimentação</strong> há ${input.daysInactive} dias.</p>
    <p>${taskLine(input.taskTitle)}</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:120px">Dias sem atividade</td><td style="padding:6px 0"><span class="tag tag-amber">${input.daysInactive} dias</span></td></tr>
    </table>
    <p>Por favor, verifique o andamento desta tarefa e tome as providências necessárias.</p>
    <p><a href="${getAppUrl()}/tasks/${input.taskId}" class="btn">Ver tarefa</a></p>
  `);
  return { subject, text, html };
}

function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}
