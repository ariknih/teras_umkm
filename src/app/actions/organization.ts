'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { DataStore } from '@/lib/data-store'
import { logAudit } from '@/lib/audit-log'
import { deleteCache } from '@/lib/cache'
import { ensureAdminPermission } from './admin'
import {
  CONTACT_KEY,
  LEGAL_DOCS,
  ORG_PUBLIC_CACHE_KEY,
  SOCIALS_KEY,
  diffSocials,
  isDocEmpty,
  isLegalSlug,
  legalCacheKey,
  parseContact,
  parseLegal,
  parseSocials,
  sameDoc,
  validateContact,
  validateLegalDoc,
  validateSocials,
  type Contact,
  type DocNode,
  type LegalState,
  type Socials
} from '@/lib/organization'

// Same contract as updateFeatureControlAction: re-validate everything, write
// conditionally on the version the admin loaded, audit what changed. Unlike
// it, every failure (including a missing permission) comes back as a result
// instead of a throw, so the CMS never unmounts an editor holding unsaved work.

type Fail = { ok: false; error: string; stale?: boolean }
export type LegalResult =
  | { ok: true; state: LegalState; version: string }
  | (Fail & { state?: LegalState; version?: string | null })

const STALE = 'Data telah diubah oleh admin lain. Muat ulang untuk melihat versi terbaru.'
const stale = (): Fail => ({ ok: false, error: STALE, stale: true })
const isVersion = (v: unknown): v is string | null => v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v)))
const errorMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message) || fallback

/** Public read for pages that need the support contact outside DataStore.getOrgPublic() (e.g. client components). */
export async function getPublicContact(): Promise<Contact> {
  return (await DataStore.getOrgPublic()).contact
}

async function adminFor(menu: string) {
  const admin: any = await ensureAdminPermission(menu)
  const name: string = admin.name || admin.email
  const audit = (action: string, targetId: string | undefined, detail: object) =>
    logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: name,
      action,
      module: 'ORGANIZATION',
      targetType: 'SETTING',
      targetId,
      detail: JSON.stringify(detail)
    })
  return { name, audit }
}

// ─── Socials ────────────────────────────────────────────────────────────────

export async function updateSocialsAction(
  next: unknown,
  lastKnownVersion: string | null
): Promise<{ ok: true; socials: Socials; version: string } | Fail> {
  try {
    const { audit } = await adminFor('org-socials')
    const result = validateSocials(next)
    if (!result.ok) {
      // The CMS UI can't produce an invalid config, so this is tamper evidence.
      await audit('SOCIALS_REJECTED', undefined, { reason: result.error, submitted: JSON.stringify(next)?.slice(0, 1000) })
      return { ok: false, error: result.error }
    }
    if (!isVersion(lastKnownVersion)) return stale()

    const current = await DataStore.getSetting(SOCIALS_KEY)
    if (current.version !== lastKnownVersion) return stale()
    const version = await DataStore.setSettingVersioned(SOCIALS_KEY, JSON.stringify(result.socials), lastKnownVersion)
    if (!version) return stale()

    // Diffed against what the footer was actually showing, never client labels.
    for (const c of diffSocials(parseSocials(current.value), result.socials)) {
      await audit(`SOCIAL_${c.change}`, c.key, { before: c.before, after: c.after })
    }
    await deleteCache(ORG_PUBLIC_CACHE_KEY)
    revalidatePath('/', 'layout')
    return { ok: true, socials: result.socials, version }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal menyimpan sosial media.') }
  }
}

// ─── Contact Support ────────────────────────────────────────────────────────

export async function updateContactAction(
  next: unknown,
  lastKnownVersion: string | null
): Promise<{ ok: true; contact: Contact; version: string } | Fail> {
  try {
    const { audit } = await adminFor('org-contact')
    const result = validateContact(next)
    if (!result.ok) return { ok: false, error: result.error }
    if (!isVersion(lastKnownVersion)) return stale()

    const current = await DataStore.getSetting(CONTACT_KEY)
    if (current.version !== lastKnownVersion) return stale()
    const version = await DataStore.setSettingVersioned(CONTACT_KEY, JSON.stringify(result.contact), lastKnownVersion)
    if (!version) return stale()

    await audit('CONTACT_UPDATED', 'contact', { before: parseContact(current.value), after: result.contact })
    await deleteCache(ORG_PUBLIC_CACHE_KEY)
    // /privacy, /terms and /bantuan read the contact.
    revalidatePath('/', 'layout')
    return { ok: true, contact: result.contact, version }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal menyimpan kontak dukungan.') }
  }
}

// ─── Legal documents ────────────────────────────────────────────────────────

type Step = { error: string; rejected?: boolean } | { next: LegalState; action: string; detail: object }

const sha256 = (doc: DocNode) => crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex')

/**
 * Shared read → check → conditional write for the three legal actions. A
 * stale save returns the latest server state so the editor can offer
 * "keep my content" without reloading away the admin's work.
 */
async function mutateLegal(
  slug: unknown,
  lastKnownVersion: unknown,
  step: (current: LegalState, adminName: string) => Step
): Promise<LegalResult> {
  if (!isLegalSlug(slug)) return { ok: false, error: 'Dokumen tidak dikenal.' }
  const meta = LEGAL_DOCS[slug]
  try {
    const { name, audit } = await adminFor(meta.menu)
    const current = await DataStore.getSetting(meta.key)
    const state = parseLegal(current.value)
    if (!isVersion(lastKnownVersion) || current.version !== lastKnownVersion) {
      return { ...stale(), state, version: current.version }
    }

    const result = step(state, name)
    if ('error' in result) {
      if (result.rejected) await audit('LEGAL_REJECTED', slug, { reason: result.error })
      return { ok: false, error: result.error }
    }

    const version = await DataStore.setSettingVersioned(meta.key, JSON.stringify(result.next), lastKnownVersion)
    if (!version) {
      const latest = await DataStore.getSetting(meta.key)
      return { ...stale(), state: parseLegal(latest.value), version: latest.version }
    }

    await audit(result.action, slug, result.detail)
    if (result.next.published !== state.published) {
      await deleteCache(legalCacheKey(slug))
      revalidatePath(meta.path)
    }
    return { ok: true, state: result.next, version }
  } catch (e) {
    return { ok: false, error: errorMessage(e, 'Gagal menyimpan dokumen.') }
  }
}

/** Saves work in progress. The live page does not change. */
export async function saveLegalDraftAction(slug: unknown, doc: unknown, lastKnownVersion: string | null) {
  return mutateLegal(slug, lastKnownVersion, (state, by) => {
    const v = validateLegalDoc(doc)
    if (!v.ok) return { error: v.error, rejected: true }
    return {
      next: { ...state, draft: v.doc, draftSavedAt: new Date().toISOString(), draftSavedBy: by },
      action: 'LEGAL_DRAFT_SAVED',
      detail: { chars: JSON.stringify(v.doc).length }
    }
  })
}

/** Replaces the live document and stamps publishedAt with server time. */
export async function publishLegalAction(slug: unknown, doc: unknown, lastKnownVersion: string | null) {
  return mutateLegal(slug, lastKnownVersion, (state, by) => {
    const v = validateLegalDoc(doc)
    if (!v.ok) return { error: v.error, rejected: true }
    if (isDocEmpty(v.doc)) return { error: 'Dokumen kosong tidak dapat diterbitkan.' }
    // Otherwise "Terakhir Diperbarui" would move without any change to the terms.
    if (state.published && sameDoc(state.published, v.doc)) return { error: 'Tidak ada perubahan untuk diterbitkan.' }
    const publishedAt = new Date().toISOString()
    return {
      next: { draft: null, draftSavedAt: null, draftSavedBy: null, published: v.doc, publishedAt, publishedBy: by },
      action: 'LEGAL_PUBLISHED',
      detail: {
        publishedAt,
        previousPublishedAt: state.publishedAt,
        beforeSha256: state.published && sha256(state.published),
        afterSha256: sha256(v.doc)
      }
    }
  })
}

export async function discardLegalDraftAction(slug: unknown, lastKnownVersion: string | null) {
  return mutateLegal(slug, lastKnownVersion, (state) =>
    state.draft
      ? {
          next: { ...state, draft: null, draftSavedAt: null, draftSavedBy: null },
          action: 'LEGAL_DRAFT_DISCARDED',
          detail: { draftSavedAt: state.draftSavedAt }
        }
      : { error: 'Tidak ada draf untuk dibuang.' }
  )
}
