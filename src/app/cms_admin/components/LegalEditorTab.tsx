'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  type LucideIcon
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { discardLegalDraftAction, publishLegalAction, saveLegalDraftAction } from '@/app/actions/organization'
import type { LegalResult } from '@/app/actions/organization'
import { LEGACY_LEGAL } from '@/lib/legal-legacy'
import {
  LEGAL_DOCS,
  formatLegalTimestamp,
  isDocEmpty,
  linkHrefError,
  sameDoc,
  validateLegalDoc,
  withScheme,
  type LegalSlug,
  type LegalState
} from '@/lib/organization'
import { useToast, Toast } from './Toast'

type Props = { slug: LegalSlug; initial: { state: LegalState; version: string | null } }

const fieldLabel = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const fieldInput =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-red-400'
const primaryButton =
  'py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
const secondaryButton =
  'py-2.5 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
// Tailwind's preflight strips heading and list styles inside the editor, so restore them to mirror the public page.
const editorClass =
  'min-h-[420px] px-5 py-4 text-sm text-slate-700 leading-relaxed focus:outline-none [&>*+*]:mt-3 [&_h1]:pt-3 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:pt-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:pt-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-900 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li+li]:mt-1.5 [&_strong]:font-bold [&_strong]:text-slate-900 [&_a]:text-primary [&_a]:underline'

const OFFLINE: LegalResult = { ok: false, error: 'Koneksi gagal. Perubahan Anda masih ada di editor, silakan coba lagi.' }

/** What the editor should hold for a given server state: the draft, else the live doc, else the pre-CMS copy. */
const baseline = (state: LegalState, slug: LegalSlug) => state.draft ?? state.published ?? LEGACY_LEGAL[slug]

/**
 * Draft/Publish editor for /privacy and /terms. Every action writes
 * conditionally on `version`. A failed or stale save never touches the editor
 * content: stale offers "keep my content" (adopt the latest version, then
 * save again) or an explicit, confirmed reload.
 */
export default function LegalEditorTab({ slug, initial }: Props) {
  const meta = LEGAL_DOCS[slug]
  const [state, setState] = useState(initial.state)
  const [version, setVersion] = useState(initial.version)
  const [content, setContent] = useState(() => validateLegalDoc(baseline(initial.state, slug)))
  const [stale, setStale] = useState<{ state: LegalState; version: string | null } | null>(null)
  const [confirm, setConfirm] = useState<'publish' | 'discard' | 'reload' | null>(null)
  const [linkHref, setLinkHref] = useState<string | null>(null) // null = link dialog closed
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        // A trailing empty paragraph would make every freshly loaded doc look unsaved.
        trailingNode: false,
        link: { openOnClick: false, autolink: false }
      })
    ],
    content: baseline(initial.state, slug),
    editorProps: {
      attributes: { class: editorClass, role: 'textbox', 'aria-multiline': 'true', 'aria-label': `Isi ${meta.label}` }
    },
    onCreate: ({ editor }) => setContent(validateLegalDoc(editor.getJSON())),
    onUpdate: ({ editor }) => setContent(validateLegalDoc(editor.getJSON()))
  })

  const tb = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: !!e?.isActive('heading', { level: 1 }),
      h2: !!e?.isActive('heading', { level: 2 }),
      h3: !!e?.isActive('heading', { level: 3 }),
      bold: !!e?.isActive('bold'),
      italic: !!e?.isActive('italic'),
      bullet: !!e?.isActive('bulletList'),
      ordered: !!e?.isActive('orderedList'),
      link: !!e?.isActive('link'),
      selection: !!e && !e.state.selection.empty,
      undo: !!e?.can().undo(),
      redo: !!e?.can().redo()
    })
  })

  const doc = content.ok ? content.doc : null
  const dirty = !doc || !sameDoc(doc, baseline(state, slug))
  const canSave = !!doc && dirty && !stale && !isPending
  const canPublish = !!doc && !isDocEmpty(doc) && !(state.published && sameDoc(doc, state.published)) && !stale && !isPending

  function run(action: () => Promise<LegalResult>, successText: string, after?: (next: LegalState) => void) {
    startTransition(async () => {
      const res = await action().catch(() => OFFLINE)
      if (!res.ok) {
        if (res.stale && res.state) setStale({ state: res.state, version: res.version ?? null })
        showToast(res.error, 'error')
        return
      }
      setState(res.state)
      setVersion(res.version)
      after?.(res.state)
      showToast(successText)
    })
  }

  function resetEditor(next: LegalState) {
    if (!editor) return
    editor.commands.setContent(baseline(next, slug))
    setContent(validateLegalDoc(editor.getJSON()))
  }

  function saveDraft() {
    if (doc && canSave) run(() => saveLegalDraftAction(slug, doc, version), 'Draf disimpan. Halaman publik belum berubah.')
  }

  function openLink() {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').run()
    setLinkHref(editor.getAttributes('link').href ?? '')
  }

  const linkValue = withScheme(linkHref ?? '')
  const linkError = linkValue ? linkHrefError(linkValue) : null

  function applyLink(e: FormEvent) {
    e.preventDefault()
    if (!editor || linkError) return
    const chain = editor.chain().focus().extendMarkRange('link')
    if (linkValue) chain.setLink({ href: linkValue }).run()
    else chain.unsetLink().run()
    setLinkHref(null)
  }

  // Ctrl/Cmd+S saves the draft, Ctrl/Cmd+K opens the link dialog. Re-bound each
  // render so the handler always sees the current doc and version.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === 's') {
        e.preventDefault()
        saveDraft()
      } else if (key === 'k' && editor?.isFocused && (tb?.selection || tb?.link)) {
        e.preventDefault()
        openLink()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ponytail: covers reload/close only, not in-app sidebar navigation; add a
  // route guard if that ever loses someone's edits.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const tools: { label: string; icon: LucideIcon; active?: boolean; disabled?: boolean; onClick: () => void }[] = editor
    ? [
        { label: 'Judul 1', icon: Heading1, active: tb?.h1, onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
        { label: 'Judul 2', icon: Heading2, active: tb?.h2, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: 'Judul 3', icon: Heading3, active: tb?.h3, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: 'Tebal', icon: Bold, active: tb?.bold, onClick: () => editor.chain().focus().toggleBold().run() },
        { label: 'Miring', icon: Italic, active: tb?.italic, onClick: () => editor.chain().focus().toggleItalic().run() },
        { label: 'Daftar poin', icon: List, active: tb?.bullet, onClick: () => editor.chain().focus().toggleBulletList().run() },
        { label: 'Daftar bernomor', icon: ListOrdered, active: tb?.ordered, onClick: () => editor.chain().focus().toggleOrderedList().run() },
        { label: 'Tautan', icon: Link2, active: tb?.link, disabled: !tb?.selection && !tb?.link, onClick: openLink },
        { label: 'Urungkan', icon: Undo2, disabled: !tb?.undo, onClick: () => editor.chain().focus().undo().run() },
        { label: 'Ulangi', icon: Redo2, disabled: !tb?.redo, onClick: () => editor.chain().focus().redo().run() }
      ]
    : []

  const badge = state.draft
    ? {
        text: `Draf belum terbit${state.draftSavedAt ? ` · disimpan ${formatLegalTimestamp(state.draftSavedAt)}` : ''}${
          state.draftSavedBy ? ` oleh ${state.draftSavedBy}` : ''
        }`,
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      }
    : state.published
      ? {
          text: `Terbit${state.publishedAt ? ` · ${formatLegalTimestamp(state.publishedAt)}` : ''}`,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      : { text: 'Belum pernah terbit', className: 'bg-amber-50 text-amber-700 border-amber-200' }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">{meta.label}</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Konten halaman publik <span className="font-mono">{meta.path}</span>. Simpan Draf tidak mengubah halaman
            publik. Terbitkan langsung menggantinya dan memperbarui tanggal &ldquo;Terakhir Diperbarui&rdquo; (WIB).
            Perubahan tampil dalam ±60 detik.
            {!state.published &&
              ' Editor berisi teks lama halaman ini: tinjau, lalu terbitkan sekali untuk mulai mengelolanya dari CMS.'}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badge.className}`}>{badge.text}</span>
      </div>

      {stale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium"
        >
          <span>Dokumen ini telah diubah oleh admin lain. Perubahan Anda masih ada di editor.</span>
          <span className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                setState(stale.state)
                setVersion(stale.version)
                setStale(null)
              }}
              className="font-bold underline cursor-pointer"
            >
              Tetap pakai konten saya
            </button>
            <button type="button" onClick={() => setConfirm('reload')} className="font-bold underline cursor-pointer">
              Muat versi terbaru
            </button>
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div
          role="toolbar"
          aria-label="Format teks"
          className="sticky top-0 z-10 flex flex-wrap gap-1 rounded-t-xl border-b border-slate-200 bg-slate-50 p-2"
        >
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              aria-pressed={t.active}
              disabled={t.disabled}
              onClick={t.onClick}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary ${
                t.active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <t.icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="min-h-[420px] px-5 py-4 text-sm text-slate-400">Memuat editor…</div>
        )}
        {!content.ok && (
          <p role="alert" className="rounded-b-xl border-t border-red-200 bg-red-50 px-5 py-2 text-xs font-medium text-red-700">
            {content.error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={meta.path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
        >
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          Lihat halaman live
        </a>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-live="polite" className="text-xs text-slate-500">
            {doc && dirty ? 'Ada perubahan belum disimpan' : ''}
          </span>
          {state.draft && (
            <button type="button" onClick={() => setConfirm('discard')} disabled={isPending || !!stale} className={secondaryButton}>
              Buang Draf
            </button>
          )}
          <button type="button" onClick={saveDraft} disabled={!canSave} className={secondaryButton}>
            Simpan Draf
          </button>
          <button type="button" onClick={() => setConfirm('publish')} disabled={!canPublish} className={primaryButton}>
            Terbitkan
          </button>
        </div>
      </div>

      <Dialog open={linkHref !== null} onOpenChange={(open) => !open && setLinkHref(null)}>
        <DialogContent className="bg-white border-slate-200 sm:max-w-md">
          <form noValidate onSubmit={applyLink} className="space-y-4">
            <DialogTitle className="text-slate-800">Tautan</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Gunakan https://, mailto:, tel:, atau alamat halaman Saloka seperti /terms. Kosongkan untuk menghapus tautan.
            </DialogDescription>
            <div>
              <label htmlFor="legal-link-href" className={fieldLabel}>
                URL
              </label>
              <input
                id="legal-link-href"
                autoFocus
                inputMode="url"
                spellCheck={false}
                placeholder="https://"
                value={linkHref ?? ''}
                onChange={(e) => setLinkHref(e.target.value)}
                aria-invalid={!!linkError}
                aria-describedby={linkError ? 'legal-link-error' : undefined}
                className={fieldInput}
              />
              {linkError && (
                <p id="legal-link-error" className="text-xs text-red-600 mt-1.5">
                  {linkError}
                </p>
              )}
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setLinkHref(null)} className={secondaryButton}>
                Batal
              </button>
              <button type="submit" disabled={!!linkError} className={primaryButton}>
                {linkValue ? 'Terapkan' : 'Hapus tautan'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm === 'publish'}
        title={`Terbitkan ${meta.label}?`}
        description={`Halaman publik ${meta.path} akan langsung berubah dan tanggal "Terakhir Diperbarui" diperbarui ke waktu sekarang (WIB).`}
        confirmLabel="Terbitkan"
        variant="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          if (doc) run(() => publishLegalAction(slug, doc, version), `${meta.label} diterbitkan.`)
        }}
      />
      <ConfirmDialog
        open={confirm === 'discard'}
        title="Buang draf?"
        description="Draf tersimpan dan perubahan di editor akan dihapus. Editor kembali ke versi yang sedang terbit."
        confirmLabel="Buang Draf"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          run(() => discardLegalDraftAction(slug, version), 'Draf dibuang.', resetEditor)
        }}
      />
      <ConfirmDialog
        open={confirm === 'reload'}
        title="Muat versi terbaru?"
        description="Isi editor akan diganti dengan versi terbaru dari server. Perubahan Anda yang belum tersimpan akan hilang."
        confirmLabel="Muat versi terbaru"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          if (!stale) return
          setState(stale.state)
          setVersion(stale.version)
          resetEditor(stale.state)
          setStale(null)
        }}
      />
    </div>
  )
}
