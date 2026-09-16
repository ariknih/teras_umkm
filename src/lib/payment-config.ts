import * as crypto from 'crypto'
import { db } from './db'

/**
 * DOKU gateway credentials, stored in the database instead of environment
 * variables.
 *
 * Why not env vars: changing a Vercel environment variable requires both
 * Vercel access and a redeploy. Keeping the credentials here means an admin
 * can configure the gateway — and flip sandbox↔live — from the CMS, taking
 * effect immediately, with the change recorded in the audit log.
 *
 * The row is encrypted at rest with AES-256-GCM under a key derived from
 * JWT_SECRET, which already exists in every environment. A database dump on
 * its own therefore leaks nothing: an attacker needs both the DB and the app's
 * JWT_SECRET. What this does NOT protect against is a CMS superadmin, who can
 * read back whether credentials are set and can replace them — that is the
 * deliberate trade for self-service configuration, and it is why every write
 * is audited.
 *
 * ponytail: reuses the generic SystemSetting key/value table and JWT_SECRET
 * rather than adding a credentials table and a separate KMS. If payment
 * volume or the number of gateways grows, move to a dedicated table with
 * per-field encryption and key rotation.
 */

const SETTING_KEY = 'payment_gateway_doku'
// Fixed salt: the derived key must be reproducible across instances and
// restarts. The secret is JWT_SECRET, not the salt.
const KEY_SALT = 'saloka:payment-config:v1'

export interface DokuGatewayConfig {
  clientId: string
  secretKey: string
  publicKey: string
  isProduction: boolean
}

function encryptionKey(): Buffer {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set — cannot read or write encrypted payment configuration.')
  }
  return crypto.scryptSync(secret, KEY_SALT, 32)
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  // iv:authTag:ciphertext — the auth tag makes tampering detectable rather
  // than silently producing garbage credentials.
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':')
}

function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
}

/**
 * The stored config, or null when none has been saved (or when it cannot be
 * decrypted — e.g. JWT_SECRET was rotated). A null sends callers to the
 * environment-variable fallback rather than failing the payment outright.
 */
export async function readStoredDokuConfig(): Promise<DokuGatewayConfig | null> {
  let row
  try {
    row = await db.systemSetting.findUnique({ where: { key: SETTING_KEY } })
  } catch (e) {
    console.error('[payment-config] Could not read stored DOKU config:', e)
    return null
  }
  if (!row?.value) return null

  try {
    const parsed = JSON.parse(decrypt(row.value))
    return {
      clientId: String(parsed.clientId || ''),
      secretKey: String(parsed.secretKey || ''),
      publicKey: String(parsed.publicKey || ''),
      isProduction: parsed.isProduction === true
    }
  } catch (e) {
    // Loud: a config that exists but cannot be decrypted is a real incident,
    // not a reason to silently fall back to sandbox.
    console.error('[payment-config] Stored DOKU config could not be decrypted (JWT_SECRET rotated?):', e)
    return null
  }
}

export async function writeStoredDokuConfig(config: DokuGatewayConfig): Promise<void> {
  const value = encrypt(JSON.stringify(config))
  await db.systemSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value },
    update: { value }
  })
}

export async function clearStoredDokuConfig(): Promise<void> {
  await db.systemSetting.deleteMany({ where: { key: SETTING_KEY } })
}

/** Last 4 characters only — enough to confirm which key is in use, never enough to use it. */
export function maskSecret(value: string): string {
  if (!value) return ''
  if (value.length <= 4) return '••••'
  return `••••${value.slice(-4)}`
}
