'use server'

import { logAudit } from '@/lib/audit-log'
import { ensureAdminPermission } from './admin'
import { getDokuConfig } from '@/lib/doku'
import {
  readStoredDokuConfig,
  writeStoredDokuConfig,
  clearStoredDokuConfig,
  maskSecret,
  type DokuGatewayConfig
} from '@/lib/payment-config'

/**
 * Admin CMS surface for the DOKU gateway credentials.
 *
 * Secrets never travel back to the browser: reads return only whether each
 * field is set plus a masked tail, and writes accept a blank field to mean
 * "keep the stored value". That way an admin can flip sandbox↔live, or rotate
 * one key, without the page ever holding the full secret.
 */

const MENU_KEY = 'payment-gateway'

export interface DokuConfigView {
  clientId: string
  hasSecretKey: boolean
  secretKeyMasked: string
  hasPublicKey: boolean
  isProduction: boolean
  /** 'database' once saved here; 'environment' while still falling back to env vars. */
  source: 'database' | 'environment'
}

type Fail = { ok: false; error: string }
const errorMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message) || fallback

export async function getDokuConfigViewAction(): Promise<{ ok: true; view: DokuConfigView } | Fail> {
  try {
    await ensureAdminPermission(MENU_KEY)

    const stored = await readStoredDokuConfig()
    if (stored) {
      return {
        ok: true,
        view: {
          // The client id is an account identifier, not a credential — showing
          // it in full is what lets an admin confirm which DOKU merchant is live.
          clientId: stored.clientId,
          hasSecretKey: !!stored.secretKey,
          secretKeyMasked: maskSecret(stored.secretKey),
          hasPublicKey: !!stored.publicKey,
          isProduction: stored.isProduction,
          source: 'database'
        }
      }
    }

    return {
      ok: true,
      view: {
        clientId: process.env.DOKU_CLIENT_ID || '',
        hasSecretKey: !!process.env.DOKU_SECRET_KEY,
        secretKeyMasked: maskSecret(process.env.DOKU_SECRET_KEY || ''),
        hasPublicKey: !!process.env.DOKU_PUBLIC_KEY,
        isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
        source: 'environment'
      }
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal memuat konfigurasi pembayaran.') }
  }
}

export interface DokuConfigInput {
  clientId: string
  /** Blank keeps the stored value. */
  secretKey: string
  /** Blank keeps the stored value. */
  publicKey: string
  isProduction: boolean
}

export async function updateDokuConfigAction(
  input: DokuConfigInput
): Promise<{ ok: true; view: DokuConfigView } | Fail> {
  try {
    const admin: any = await ensureAdminPermission(MENU_KEY)

    const clientId = String(input?.clientId ?? '').trim()
    const secretKeyInput = String(input?.secretKey ?? '').trim()
    // Public keys are pasted as PEM blocks; only trim the outer whitespace.
    const publicKeyInput = String(input?.publicKey ?? '').trim()
    const isProduction = input?.isProduction === true

    const existing = await readStoredDokuConfig()
    const next: DokuGatewayConfig = {
      clientId,
      secretKey: secretKeyInput || existing?.secretKey || '',
      publicKey: publicKeyInput || existing?.publicKey || '',
      isProduction
    }

    if (!next.clientId || !next.secretKey) {
      return { ok: false, error: 'Client ID dan Secret Key wajib diisi.' }
    }

    // The same rule the runtime enforces, surfaced here as a form error rather
    // than as a failed payment later: going live without the webhook public key
    // means every DOKU notification falls back to HMAC verification.
    if (isProduction && !next.publicKey) {
      return {
        ok: false,
        error:
          'Public Key wajib diisi untuk mode Live — tanpa itu verifikasi webhook DOKU tidak dapat memakai RSA.'
      }
    }

    await writeStoredDokuConfig(next)

    // Audit the change, never the values. `before` records what the gateway was
    // switching from, which is the question asked after an incident.
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: isProduction ? 'PAYMENT_GATEWAY_SET_LIVE' : 'PAYMENT_GATEWAY_SET_SANDBOX',
      module: 'SYSTEM',
      targetType: 'SETTING',
      targetId: 'payment_gateway_doku',
      detail: JSON.stringify({
        gateway: 'DOKU',
        mode: isProduction ? 'LIVE' : 'SANDBOX',
        previousMode: existing ? (existing.isProduction ? 'LIVE' : 'SANDBOX') : 'ENV_FALLBACK',
        clientId: next.clientId,
        secretKeyChanged: !!secretKeyInput,
        publicKeyChanged: !!publicKeyInput
      })
    })

    return {
      ok: true,
      view: {
        clientId: next.clientId,
        hasSecretKey: !!next.secretKey,
        secretKeyMasked: maskSecret(next.secretKey),
        hasPublicKey: !!next.publicKey,
        isProduction: next.isProduction,
        source: 'database'
      }
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal menyimpan konfigurasi pembayaran.') }
  }
}

/**
 * Drops the stored row so the gateway falls back to environment variables.
 * The escape hatch if a saved config is wrong and payments must revert.
 */
export async function resetDokuConfigAction(): Promise<{ ok: true } | Fail> {
  try {
    const admin: any = await ensureAdminPermission(MENU_KEY)
    await clearStoredDokuConfig()
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'PAYMENT_GATEWAY_RESET',
      module: 'SYSTEM',
      targetType: 'SETTING',
      targetId: 'payment_gateway_doku',
      detail: JSON.stringify({ gateway: 'DOKU', revertedTo: 'environment variables' })
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal mengatur ulang konfigurasi pembayaran.') }
  }
}

/**
 * Live connectivity check: asks DOKU for the status of an invoice that cannot
 * exist. A well-formed answer (including NOT_FOUND) proves the credentials and
 * signature are accepted; an auth failure surfaces here instead of on a real
 * customer's payment.
 */
export async function testDokuConnectionAction(): Promise<
  { ok: true; mode: 'LIVE' | 'SANDBOX'; baseUrl: string; detail: string } | Fail
> {
  try {
    await ensureAdminPermission(MENU_KEY)
    const { checkDokuOrderStatus } = await import('@/lib/doku')
    const config = await getDokuConfig()

    if (!config.clientId || !config.secretKey) {
      return { ok: false, error: 'Kredensial DOKU belum lengkap.' }
    }

    const probe = `probe-${Date.now().toString(36)}`
    const res = await checkDokuOrderStatus(probe)

    return {
      ok: true,
      mode: config.isProduction ? 'LIVE' : 'SANDBOX',
      baseUrl: config.baseUrl,
      detail:
        res.status === 'NOT_FOUND'
          ? 'DOKU menerima kredensial dan menjawab (invoice uji tidak ditemukan — ini yang diharapkan).'
          : `DOKU menjawab dengan status: ${res.status}.`
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal menghubungi DOKU.') }
  }
}
