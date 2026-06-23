// Workflow Service
// Centralized workflow state machine for task transitions

import type { StageId, Task } from '@/src/types/domain';

// Define allowed transitions between stages
const ALLOWED_TRANSITIONS: Record<StageId, StageId[]> = {
  entrada: ['analise'],
  analise: ['aguardando_docs', 'andamento', 'entrada'],
  aguardando_docs: ['andamento', 'analise'],
  andamento: ['revisao', 'entrada', 'analise', 'aguardando_docs'],
  revisao: ['concluida', 'andamento'],
  concluida: ['arquivada'], // Only archive from completed
  arquivada: [], // Cannot transition from archived
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(fromStage: StageId, toStage: StageId): boolean {
  return ALLOWED_TRANSITIONS[fromStage]?.includes(toStage) ?? false;
}

/**
 * Check if transition is backward (moving to earlier stage)
 */
export function isBackwardTransition(fromStage: StageId, toStage: StageId): boolean {
  const stages: StageId[] = [
    'entrada',
    'analise',
    'aguardando_docs',
    'andamento',
    'revisao',
    'concluida',
  ];
  const fromIndex = stages.indexOf(fromStage);
  const toIndex = stages.indexOf(toStage);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex < fromIndex;
}

/**
 * Get allowed next stages for current stage
 */
export function getAllowedTransitions(currentStage: StageId): StageId[] {
  return ALLOWED_TRANSITIONS[currentStage] || [];
}

/**
 * Validate and execute stage transition
 */
export function validateTransition(
  fromStage: StageId,
  toStage: StageId
): { valid: boolean; backward: boolean; message?: string } {
  if (!isValidTransition(fromStage, toStage)) {
    return {
      valid: false,
      backward: false,
      message: `Cannot move from ${fromStage} to ${toStage}`,
    };
  }

  const backward = isBackwardTransition(fromStage, toStage);

  return { valid: true, backward };
}

/**
 * Check if task can be completed (move to concluida)
 */
export function canComplete(currentStage: StageId): boolean {
  return isValidTransition(currentStage, 'concluida');
}

/**
 * Check if task can be archived (requires concluida stage)
 */
export function canArchive(task: Task): boolean {
  return task.stageId === 'concluida' && !task.archived;
}

/**
 * Check if task can be restored (requires arquivada stage)
 */
export function canRestore(task: Task): boolean {
  return task.archived && task.stageId === 'arquivada';
}

/**
 * Get stage name for display
 */
export function getStageName(stageId: StageId): string {
  const stageNames: Record<StageId, string> = {
    entrada: 'Entrada',
    analise: 'Em análise',
    aguardando_docs: 'Aguardando documentos',
    andamento: 'Em andamento',
    revisao: 'Em revisão',
    concluida: 'Concluída',
    arquivada: 'Arquivada',
  };
  return stageNames[stageId] || stageId;
}
