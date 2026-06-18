// Task Validation
// Validation rules for task creation and updates

import { z } from 'zod';

// Task validation schema
export const CreateTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().min(2).max(100),
  priority: z.enum(['baixa', 'média', 'alta', 'crítica']),
  responsibleUserId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()),
  dueDate: z.date().optional(),
  confidentialityLevel: z.enum(['público', 'interno', 'restrito']),
  internalNotes: z.string().max(1000).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

/**
 * Generate reference code for task
 * Format: TASK-YYYYMMDD-XXXXX (e.g., TASK-20240618-A7F3B)
 */
export function generateReferenceCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TASK-${date}-${random}`;
}

/**
 * Normalize text for searching (lowercase, remove accents, trim)
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

/**
 * Validate task input for creation
 */
export function validateTaskCreation(data: unknown) {
  return CreateTaskSchema.parse(data);
}

/**
 * Validate task input for update
 */
export function validateTaskUpdate(data: unknown) {
  return UpdateTaskSchema.parse(data);
}
