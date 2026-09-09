import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function sha256Hex(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function looksLikeBcrypt(hash: string): boolean {
  return typeof hash === 'string' && hash.startsWith('$2')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verifies against either a bcrypt hash or a legacy unsalted SHA-256 hash
// (every passwordHash written before this migration). Callers with write
// access to the user row should rehash and save on a successful legacy
// verify — see login() in auth.ts — so accounts upgrade on next login
// instead of a forced mass reset.
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false
  if (looksLikeBcrypt(hash)) return bcrypt.compare(password, hash)
  return sha256Hex(password) === hash
}

export function isLegacyHash(hash: string): boolean {
  return !!hash && !looksLikeBcrypt(hash)
}
