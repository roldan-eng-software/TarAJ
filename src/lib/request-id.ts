// Utility: Request ID generation
// Generate unique request IDs for tracking across logs

export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
