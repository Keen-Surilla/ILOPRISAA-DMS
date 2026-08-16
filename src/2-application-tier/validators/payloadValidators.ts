export interface ValidationResult<T = unknown> { valid: boolean; errors: string[]; sanitized: T | null; }

export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;').replace(/\0/g, '').trim();
}

export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export interface LoginValidationResult {
  valid: boolean;
  error: string | null;
  sanitizedEmail?: string;
}

export function validateLoginInput(email: string, password: string): LoginValidationResult {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { valid: false, error: 'Email is required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { valid: false, error: 'Password is required.' };
  }

  return { 
    valid: true, 
    error: null, 
    sanitizedEmail: trimmedEmail 
  };
}