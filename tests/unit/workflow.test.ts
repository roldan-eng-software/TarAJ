// Workflow Transition Unit Tests
// Test valid and invalid state transitions in the Kanban board

import { describe, it, expect } from 'vitest';

const WORKFLOW_STAGES = [
  'entrada',
  'analise',
  'aguardando_docs',
  'andamento',
  'revisao',
  'concluida',
  'arquivada',
];

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  entrada: ['analise', 'aguardando_docs'],
  analise: ['aguardando_docs', 'andamento', 'revisao', 'entrada'],
  aguardando_docs: ['analise', 'andamento'],
  andamento: ['aguardando_docs', 'revisao', 'concluida'],
  revisao: ['andamento', 'concluida'],
  concluida: ['arquivada'],
};

function isValidTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function isBackwardTransition(from: string, to: string): boolean {
  const fromIndex = WORKFLOW_STAGES.indexOf(from);
  const toIndex = WORKFLOW_STAGES.indexOf(to);
  return toIndex < fromIndex;
}

describe('Workflow Transitions', () => {
  describe('Valid transitions', () => {
    it('should allow moving from entrada to analise', () => {
      expect(isValidTransition('entrada', 'analise')).toBe(true);
    });

    it('should allow moving from analise to andamento', () => {
      expect(isValidTransition('analise', 'andamento')).toBe(true);
    });

    it('should allow moving from andamento to revisao', () => {
      expect(isValidTransition('andamento', 'revisao')).toBe(true);
    });

    it('should allow moving from revisao to concluida', () => {
      expect(isValidTransition('revisao', 'concluida')).toBe(true);
    });
  });

  describe('Invalid transitions', () => {
    it('should NOT allow moving directly from entrada to andamento', () => {
      expect(isValidTransition('entrada', 'andamento')).toBe(false);
    });

    it('should NOT allow moving from concluida to any other state', () => {
      expect(isValidTransition('concluida', 'andamento')).toBe(false);
      expect(isValidTransition('concluida', 'entrada')).toBe(false);
    });

    it('should NOT allow moving from revisao to entrada', () => {
      expect(isValidTransition('revisao', 'entrada')).toBe(false);
    });
  });

  describe('Backward transitions', () => {
    it('should detect backward transition from analise to entrada', () => {
      expect(isBackwardTransition('analise', 'entrada')).toBe(true);
    });

    it('should detect backward transition from revisao to andamento', () => {
      expect(isBackwardTransition('revisao', 'andamento')).toBe(true);
    });

    it('should NOT detect forward transition as backward', () => {
      expect(isBackwardTransition('entrada', 'analise')).toBe(false);
    });
  });

  describe('Backward allowed transitions', () => {
    it('should allow backward move from analise to entrada', () => {
      expect(isValidTransition('analise', 'entrada')).toBe(true);
      expect(isBackwardTransition('analise', 'entrada')).toBe(true);
    });

    it('should allow backward move from revisao to andamento', () => {
      expect(isValidTransition('revisao', 'andamento')).toBe(true);
      expect(isBackwardTransition('revisao', 'andamento')).toBe(true);
    });
  });
});
