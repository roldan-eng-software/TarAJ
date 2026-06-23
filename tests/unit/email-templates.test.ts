import { describe, it, expect, beforeAll } from 'vitest';
import {
  taskCreatedTemplate, taskAssignedTemplate, stageChangedTemplate,
  mentionTemplate, completedTemplate, archivedTemplate, restoredTemplate,
  dueDateUpcomingTemplate, dueDateOverdueTemplate,
} from '@/src/domain/notifications/email-templates';

const BASE_INPUT = {
  taskTitle: 'Analisar contrato',
  actorName: 'João Silva',
  taskId: 'task_123',
};

beforeAll(() => {
  process.env.APP_URL = 'http://localhost:3000';
});

describe('taskCreatedTemplate', () => {
  const tpl = taskCreatedTemplate(BASE_INPUT);

  it('should include subject with task title', () => {
    expect(tpl.subject).toContain('Analisar contrato');
    expect(tpl.subject).toContain('[TarAJ]');
  });

  it('should include plain text version', () => {
    expect(tpl.text).toContain('Analisar contrato');
    expect(tpl.text).toContain('João Silva');
  });

  it('should include HTML with task title and actor', () => {
    expect(tpl.html).toContain('Analisar contrato');
    expect(tpl.html).toContain('João Silva');
    expect(tpl.html).toContain('<a href=');
    expect(tpl.html).toContain('class="btn"');
  });

  it('should include link to task', () => {
    expect(tpl.html).toContain('/tasks/task_123');
  });

  it('should wrap in base HTML structure', () => {
    expect(tpl.html).toContain('<!DOCTYPE html>');
    expect(tpl.html).toContain('Sistema Jurídico');
    expect(tpl.html).toContain('</body>');
    expect(tpl.html).toContain('</html>');
  });
});

describe('taskAssignedTemplate', () => {
  const tpl = taskAssignedTemplate(BASE_INPUT);

  it('should indicate assignment', () => {
    expect(tpl.subject).toContain('Responsável alterado');
    expect(tpl.text).toContain('designado responsável');
    expect(tpl.html).toContain('designado');
  });
});

describe('stageChangedTemplate', () => {
  it('should show forward movement', () => {
    const tpl = stageChangedTemplate({ ...BASE_INPUT, fromStage: 'Entrada', toStage: 'Em análise', backward: false });
    expect(tpl.subject).toContain('Estágio alterado');
    expect(tpl.html).toContain('Em análise');
    expect(tpl.html).toContain('Entrada');
  });

  it('should show backward movement', () => {
    const tpl = stageChangedTemplate({ ...BASE_INPUT, fromStage: 'Revisão', toStage: 'Em andamento', backward: true });
    expect(tpl.html).toContain('Em andamento');
    expect(tpl.html).toContain('Revisão');
  });
});

describe('mentionTemplate', () => {
  const tpl = mentionTemplate(BASE_INPUT);

  it('should mention the actor', () => {
    expect(tpl.subject).toContain('Menção');
    expect(tpl.text).toContain('mencionado');
    expect(tpl.html).toContain('mencionado');
  });
});

describe('completedTemplate', () => {
  const tpl = completedTemplate(BASE_INPUT);

  it('should indicate completion', () => {
    expect(tpl.subject).toContain('concluída');
    expect(tpl.html).toContain('concluída');
  });
});

describe('archivedTemplate', () => {
  const tpl = archivedTemplate(BASE_INPUT);

  it('should indicate archival', () => {
    expect(tpl.subject).toContain('arquivada');
    expect(tpl.html).toContain('arquivada');
  });
});

describe('restoredTemplate', () => {
  const tpl = restoredTemplate({ ...BASE_INPUT, targetStage: 'Em análise' });

  it('should indicate restoration', () => {
    expect(tpl.subject).toContain('restaurada');
    expect(tpl.html).toContain('restaurada');
    expect(tpl.html).toContain('Em análise');
  });
});

describe('dueDateUpcomingTemplate', () => {
  const tpl = dueDateUpcomingTemplate({ ...BASE_INPUT, dueDate: '2026-06-25' });

  it('should warn about upcoming due date', () => {
    expect(tpl.subject).toContain('Prazo próximo');
    expect(tpl.html).toContain('próximo');
    expect(tpl.html).toContain('2026-06-25');
  });
});

describe('dueDateOverdueTemplate', () => {
  const tpl = dueDateOverdueTemplate({ ...BASE_INPUT, dueDate: '2026-06-20' });

  it('should warn about overdue due date', () => {
    expect(tpl.subject).toContain('Prazo vencido');
    expect(tpl.html).toContain('vencido');
    expect(tpl.html).toContain('2026-06-20');
  });
});

describe('HTML safety', () => {
  it('should escape HTML in task title', () => {
    const tpl = taskCreatedTemplate({
      taskTitle: '<script>alert("xss")</script>',
      actorName: 'Test',
      taskId: 'task_xss',
    });
    expect(tpl.html).not.toContain('<script>');
    expect(tpl.html).toContain('&lt;script&gt;');
  });

  it('should escape HTML in actor name', () => {
    const tpl = taskCreatedTemplate({
      taskTitle: 'Safe title',
      actorName: '<b>hacker</b>',
      taskId: 'task_xss2',
    });
    expect(tpl.html).not.toContain('<b>hacker</b>');
    expect(tpl.html).toContain('&lt;b&gt;hacker&lt;/b&gt;');
  });
});
