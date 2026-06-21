export function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function isOneOf<T>(value: unknown, allowed: readonly T[]): value is T {
  return allowed.includes(value as T);
}

export function isValidDate(value: unknown): value is Date | string {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'string') return !isNaN(Date.parse(value));
  return false;
}

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function parseNumericId(value: string): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}
