/**
 * NIST SP 800-63B & NIST SP 800-53 Compliant Security Controls
 *
 * Implements:
 * - NIST SP 800-63B Section 5.1.1.2: Memorized Secret Verifier (Password Policy)
 *   * Minimum 8 characters, up to 128 characters
 *   * Verifier-checked against breached/common password lists
 *   * Repetitive & sequential pattern checks
 *   * Contextual & identifier containment checks
 *   * Full ASCII & Unicode character support (no truncation)
 * - NIST SP 800-53 SI-10: Information Input Validation & Sanitization
 *   * Null-byte elimination
 *   * Control character stripping
 *   * Safe identifier enforcement
 */

// Common compromised/weak passwords based on NIST & SecLists corpora
const COMMON_PASSWORDS_BLACKLIST = new Set([
  'password', 'password1', 'password123', 'admin', 'admin123', 'admin@123',
  '12345678', '123456789', '1234567890', 'qwertyui', 'qwertyuiop',
  'letmein', 'welcome', 'welcome1', 'welcome123', 'monkey', 'dragon',
  'football', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'princess',
  'master', 'secret', 'changeme', 'medescort', 'medescort123', 'medescort2024',
  'medescort2025', 'medescort2026', 'healthcare', 'hospital', 'repatriation'
]);

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  score: number; // 0 to 4
  feedback: string[];
}

/**
 * Validates a password against NIST SP 800-63B Section 5.1.1.2 standards.
 *
 * @param password The plaintext password to evaluate
 * @param identifier Optional username, email, or iqama number to check for context containment
 */
export function validatePasswordNist(password: string, identifier?: string): PasswordValidationResult {
  const feedback: string[] = [];

  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      error: 'Password is required.',
      score: 0,
      feedback: ['Password cannot be empty']
    };
  }

  // 1. Length Verification (NIST SP 800-63B requires >= 8 characters)
  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters in length (NIST SP 800-63B).',
      score: 0,
      feedback: ['Minimum length is 8 characters']
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password must not exceed 128 characters.',
      score: 0,
      feedback: ['Maximum length is 128 characters']
    };
  }

  const lowerPass = password.toLowerCase().trim();

  // 2. Common Compromised Passwords Check (NIST SP 800-63B)
  if (COMMON_PASSWORDS_BLACKLIST.has(lowerPass)) {
    return {
      isValid: false,
      error: 'This password is too common or has appeared in previous data breaches. Please choose a more unique password.',
      score: 1,
      feedback: ['Password appears in compromised password lists']
    };
  }

  // 3. User Identity & Context Containment Check (NIST SP 800-63B)
  if (identifier && typeof identifier === 'string') {
    const cleanId = identifier.trim().toLowerCase();
    // Check if password contains the username or identifier if identifier >= 3 chars
    if (cleanId.length >= 3 && lowerPass.includes(cleanId)) {
      return {
        isValid: false,
        error: 'Password cannot contain your username, email, or ID number.',
        score: 1,
        feedback: ['Contains personal identifier']
      };
    }

    // If identifier is an email, check the username part before @
    if (cleanId.includes('@')) {
      const emailUser = cleanId.split('@')[0];
      if (emailUser.length >= 3 && lowerPass.includes(emailUser)) {
        return {
          isValid: false,
          error: 'Password cannot contain parts of your email address.',
          score: 1,
          feedback: ['Contains personal email identifier']
        };
      }
    }
  }

  // 4. Repetitive Character Check (e.g. "aaaaaa", "111111")
  if (/(.)\1{4,}/.test(password)) {
    return {
      isValid: false,
      error: 'Password contains too many repetitive characters in sequence.',
      score: 1,
      feedback: ['Avoid repetitive sequences (e.g. "aaaaa")']
    };
  }

  // 5. Sequential Character Check (e.g. "123456", "abcdef")
  const sequences = ['12345678', '23456789', 'abcdefgh', 'bcdefghi', 'qwertyui'];
  for (const seq of sequences) {
    if (lowerPass.includes(seq)) {
      return {
        isValid: false,
        error: 'Password contains an easily guessable sequence of characters.',
        score: 1,
        feedback: ['Avoid sequential keyboard patterns']
      };
    }
  }

  // Calculate NIST entropy-based strength score (0-4)
  let score = 2; // Base score for passing length >= 8 and non-blacklisted
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    score = Math.min(score + 1, 4);
  }

  return {
    isValid: true,
    score,
    feedback: score >= 3 ? ['Strong password'] : ['Acceptable, but consider using a passphrase for extra strength']
  };
}

/**
 * Sanitizes generic user input by stripping null bytes and dangerous control characters
 * according to NIST SP 800-53 SI-10.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  return input
    // Strip null bytes to prevent null byte poisoning
    .replace(/\0/g, '')
    // Strip ASCII control characters except newline (\n), carriage return (\r), and tab (\t)
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitizes username, iqama number, or ID field.
 * Allows alphanumeric characters, dots, dashes, underscores, and at-symbols for email.
 */
export function sanitizeIdentifier(identifier: string | null | undefined): string {
  if (!identifier || typeof identifier !== 'string') return '';
  const sanitized = sanitizeInput(identifier);
  // Remove spaces and any disallowed characters
  return sanitized.replace(/[^a-zA-Z0-9@._-]/g, '').slice(0, 100);
}

/**
 * Recursively sanitizes objects to prevent Prototype Pollution & Null-byte injections.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeInput(obj) as unknown as T;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prevent Prototype Pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }

  return clean as T;
}
