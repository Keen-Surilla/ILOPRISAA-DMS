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
  field?: 'email' | 'password';
  sanitizedEmail?: string;
}

export function validateLoginInput(email: string, password: string): LoginValidationResult {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { valid: false, error: 'Email is required.', field: 'email' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.', field: 'email' };
  }
  if (!password) {
    return { valid: false, error: 'Password is required.', field: 'password' };
  }

  return { 
    valid: true, 
    error: null, 
    sanitizedEmail: trimmedEmail 
  };
}

// --- Security hardening additions ---
//
// NOTE: this is deliberately only ever applied to fields that get rendered
// as HTML or used to build queries elsewhere (e.g. email, free-text profile
// fields). It is intentionally NOT applied to password fields: passwords are
// hashed by Supabase Auth, never rendered, and never touch raw SQL, so
// pattern-matching them only risks rejecting a legitimate password that
// happens to contain a semicolon or the word "select".
const INJECTION_SIGNATURES: RegExp[] = [
  /<\s*script/i,
  /<\s*iframe/i,
  /on\w+\s*=\s*['"]/i,        // onerror=, onload=, onclick=, etc.
  /javascript\s*:/i,
  /\bunion\b[\s\S]{0,20}\bselect\b/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b/i,
  /--\s*$/,
  /;\s*--/,
  /'\s*or\s*'?1'?\s*=\s*'?1/i,
  /\bxp_cmdshell\b/i,
];

export function containsInjectionSignature(input: string): boolean {
  if (!input) return false;
  return INJECTION_SIGNATURES.some((pattern) => pattern.test(input));
}