import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Checks if a string is already a valid bcrypt hash.
 */
export function isBcryptHash(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  return BCRYPT_REGEX.test(str.trim());
}

export { validatePasswordNist } from './security';

/**
 * Hashes a plaintext password using bcrypt with salt rounds = 10.
 * If the string is already a bcrypt hash, it returns it unchanged.
 * Enforces NIST SP 800-63B length constraints (maximum 128 characters).
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) {
    throw new Error('Password cannot be empty');
  }
  if (plainText.length > 128) {
    throw new Error('Password length exceeds maximum permitted limit of 128 characters');
  }
  if (isBcryptHash(plainText)) {
    return plainText;
  }
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Synchronous version of hashPassword (useful in migration scripts or non-async contexts).
 */
export function hashPasswordSync(plainText: string): string {
  if (!plainText) {
    throw new Error('Password cannot be empty');
  }
  if (isBcryptHash(plainText)) {
    return plainText;
  }
  return bcrypt.hashSync(plainText, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored password.
 * Supports all standard bcrypt hashes ($2a$, $2b$, $2y$), and includes a fallback for legacy plaintext passwords.
 */
export async function verifyPassword(plainText: string, storedHashOrPlain: string): Promise<boolean> {
  if (!plainText || !storedHashOrPlain) return false;

  const rawPlain = String(plainText);
  const trimmedPlain = rawPlain.trim();
  const rawStored = String(storedHashOrPlain);
  const trimmedStored = rawStored.trim();

  // If stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (trimmedStored.startsWith('$2') || isBcryptHash(trimmedStored)) {
    try {
      if (await bcrypt.compare(rawPlain, trimmedStored)) return true;
      if (await bcrypt.compare(trimmedPlain, trimmedStored)) return true;
    } catch (e) {
      console.error('Error comparing bcrypt hash:', e);
    }
  }

  // Fallback for legacy plaintext password
  return rawPlain === rawStored || trimmedPlain === trimmedStored;
}

/**
 * Synchronous version of verifyPassword.
 */
export function verifyPasswordSync(plainText: string, storedHashOrPlain: string): boolean {
  if (!plainText || !storedHashOrPlain) return false;

  const rawPlain = String(plainText);
  const trimmedPlain = rawPlain.trim();
  const rawStored = String(storedHashOrPlain);
  const trimmedStored = rawStored.trim();

  if (trimmedStored.startsWith('$2') || isBcryptHash(trimmedStored)) {
    try {
      if (bcrypt.compareSync(rawPlain, trimmedStored)) return true;
      if (bcrypt.compareSync(trimmedPlain, trimmedStored)) return true;
    } catch (e) {
      console.error('Error comparing bcrypt hash sync:', e);
    }
  }

  // Fallback for legacy plaintext password
  return rawPlain === rawStored || trimmedPlain === trimmedStored;
}
