export interface WhatsAppTemplateInput {
  taskTitle: string;
  actorName: string;
  taskId: string;
  appUrl?: string;
}

function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}

function taskLink(taskId: string, appUrl?: string): string {
  const base = appUrl || getAppUrl();
  return `${base}/tasks/${taskId}`;
}

export function whatsappTaskCreatedTemplate(input: WhatsAppTemplateInput): string {
  return `📋 *Nova tarefa criada*\n\nTarefa: *${input.taskTitle}*\nCriado por: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappTaskAssignedTemplate(input: WhatsAppTemplateInput): string {
  return `👤 *Responsável alterado*\n\nVocê foi designado pela tarefa: *${input.taskTitle}*\nPor: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappStageChangedTemplate(input: WhatsAppTemplateInput & { fromStage: string; toStage: string; backward: boolean }): string {
  const direction = input.backward ? '↩️ retornou para' : '➡️ avançou para';
  return `🔄 *Estágio alterado*\n\nTarefa: *${input.taskTitle}*\n${direction} *${input.toStage}*\nPor: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappMentionTemplate(input: WhatsAppTemplateInput): string {
  return `💬 *Menção em comentário*\n\nVocê foi mencionado por ${input.actorName} na tarefa: *${input.taskTitle}*\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappCompletedTemplate(input: WhatsAppTemplateInput): string {
  return `✅ *Tarefa concluída*\n\nTarefa: *${input.taskTitle}*\nConcluída por: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappArchivedTemplate(input: WhatsAppTemplateInput): string {
  return `📦 *Tarefa arquivada*\n\nTarefa: *${input.taskTitle}*\nArquivada por: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappRestoredTemplate(input: WhatsAppTemplateInput & { targetStage: string }): string {
  return `♻️ *Tarefa restaurada*\n\nTarefa: *${input.taskTitle}*\nRestaurada para: *${input.targetStage}*\nPor: ${input.actorName}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappDueDateUpcomingTemplate(input: WhatsAppTemplateInput & { dueDate: string }): string {
  return `⏰ *Prazo próximo*\n\nTarefa: *${input.taskTitle}*\nPrazo: ${input.dueDate}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappDueDateOverdueTemplate(input: WhatsAppTemplateInput & { dueDate: string }): string {
  return `🚨 *Prazo vencido*\n\nTarefa: *${input.taskTitle}*\nPrazo: ${input.dueDate}\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}

export function whatsappInactivityAlertTemplate(input: WhatsAppTemplateInput & { daysInactive: number }): string {
  return `⏳ *Tarefa inativa*\n\nTarefa: *${input.taskTitle}*\nSem movimentação há *${input.daysInactive} dias*\n\nPor favor, verifique o andamento desta tarefa.\n\n🔗 ${taskLink(input.taskId, input.appUrl)}`;
}
