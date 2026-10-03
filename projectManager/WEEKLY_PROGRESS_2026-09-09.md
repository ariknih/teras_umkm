# Weekly Progress Update — Roadmap September 2026 (status akhir, 1–30 Sep)
_Disusun 9 September 2026, diperbarui 30 September 2026. Sumber: roadmap "Saloka September 2026", riwayat git `teras_umkm` (branch `master`, HEAD `717d4e6`, working tree bersih), dan verifikasi langsung ke kode (CodeGraph + grep) pada 30 September._

Hari ini Minggu E (28–30 Sep, penutupan). Dari 7 target bulan ini, **belum ada satu pun yang memenuhi "Definisi Selesai" roadmap secara penuh** — tetapi Pembayaran, LMS, dan Verifikasi sudah dekat. Sisa pekerjaan yang harus dibawa ke Oktober ada di bagian akhir.

---

## Ringkasan

| Inisiatif | Target | Status 30 Sep | Sisa utama |
|---|---|---|---|
| Snackbox v1 | Minggu A (6 Sep) | 🟡 Sisi pelanggan jalan; 3 layar admin masih mock | Order History, Coverage, Payout Mitra; QA & rilis v1 |
| Sistem Komunitas | Minggu B (13 Sep) | 🟡 7 dari 17 modul nyata; 10 masih "Segera Hadir" | 10 modul, QA mobile, feature-freeze |
| Pembayaran & Pengiriman | Minggu C (20 Sep) | 🟡 DOKU live; pelacakan kurir belum tersambung | Sinkronisasi Biteship, rekonsiliasi, uji siklus pesanan |
| LMS | Minggu D (27 Sep) | 🟢 Progres, sertifikat, CMS, cache rilis | Review UX navigasi (subjektif) |
| Kepatuhan Pajak | Paralel | ❌ Belum ada progres | Semua |
| ISO 27001 | Paralel | 🟡 Kontrol teknis sebagian besar tertutup; dokumen ISMS belum | Kebijakan, SoA, risk register, PIC |
| Verifikasi (KYC) | Paralel | 🟢 Alur Didit stabil & diamankan | Audit alur terdokumentasi |

---

## 1. Finalisasi Snackbox — 🟡

**Terverifikasi ada:** pencarian kelurahan nasional + deteksi GPS/IP (5–9 Sep), perombakan halaman/cart/kartu produk (`49c0d07`), checkout Snackbox digabung ke pipeline pesanan Marketplace (`src/app/cart/page.tsx` mengirim item Snackbox bersama item biasa dalam satu payload pesanan), admin "Mitra & Produk Snackbox" memakai data asli.

**Belum:**
- Tiga layar admin masih ditandai `mock: true` di `src/app/cms_admin/nav.config.ts`:
  - **Order History Snackbox** — tidak tersimpan ke database.
  - **Coverage Kelurahan** — `KelurahanTab.tsx` menyimpan ke `localStorage` browser, tidak dibagikan antar admin/perangkat.
  - **Payout Mitra** — `SnackboxPayoutTab.tsx` berisi `MOCK_BATCHES` hardcoded; tombol eksekusi memanggil `processSnackboxBatchPayoutAction('BATCH-SNACKBOX-2026-08', 3612500, 12)` dengan angka tetap dan tidak memindahkan uang.
- QA slider bagi hasil 15–20% dan pencarian kategori merchant belum terdokumentasi.
- Bug bash terdokumentasi dan pernyataan rilis resmi "Snackbox v1" belum ada.

## 2. Finalisasi Sistem Komunitas — 🟡

**Terverifikasi ada:**
- 7 dari 17 modul navigasi benar-benar berfungsi: Diskusi, Aktivitas, Event, Galeri, Produk Komunitas, Marketplace/Produk Anggota, Pengumuman. Koperasi: Simpanan, SHU, Laporan, Pendanaan (sebagian).
- Kas Komunitas/Kas Koperasi (dompet milik komunitas), ledger pendapatan platform, penarikan Kas yang disetujui Finance Admin, panel Kas & direktori anggota untuk superadmin (16 Sep).
- Pembayaran iuran join via DOKU; payout referral multi-tier diperbaiki; audit siklus referral (`scripts/audit-referral-cycles.ts`); kontrol akses manajer komunitas (`requireCommunityManager`).
- Feature Control (kill switch), badge/tipe tunggal (`community-badge.ts`), template modul (`community-templates.ts`), pengalih komunitas (`CommunityPickerModal`).

**Belum:**
- **10 modul masih placeholder "Segera Hadir"** (`ComingSoonTab` di `CommunityDetailClient.tsx`): Business Matching, Pelatihan, Mentor, Kolaborasi, Kelas, Kompetisi, Startup, Merchant, Supplier, Promo. Ini modul inti template Business, Education, dan Culinary — tanpa mereka, tiga dari empat template Perkumpulan hanya berisi menu umum.
- QA mobile menyeluruh dan sign-off/feature-freeze belum dinyatakan.
- Item Phase 6 (`PHASE6_TODO.md`) masih terbuka dan terverifikasi: pencairan pinjaman (status `DISBURSED` ada di skema & UI tapi tidak ada kredit dompet), transfer SHU otomatis ke wallet, penagihan tier (`upgradeCommunityTierAction` masih gratis/instan tanpa model Subscription/Invoice).

## 3. Integrasi Pembayaran & Pengiriman — 🟡

**Terverifikasi ada:**
- **DOKU adalah satu-satunya gateway dan sudah live sejak 16 Sep** (`9179095`). Kode Midtrans dan fallback Komerce sudah dihapus — tersisa hanya komentar. `payment-gateway.ts` hanya memuat adapter DOKU.
- Route `/api/doku/{checkout,verify,notification}` dan `/api/payment/{checkout,verify}`; webhook diverifikasi RSA-SHA256 (fallback HMAC) dan menolak jika tidak ada kunci; cek status langsung ke DOKU sebelum settlement; batas min/maks deposit; idempotensi `orderId` unik.
- Biteship: pencarian area, tarif ongkir, kalkulasi di keranjang.
- Payout pesanan (`settleOrderPayouts`) berjalan saat pesanan selesai; suite QA otomatis `scripts/qa_full_suite.ts` (85 assertion).

**Belum:**
- **Sinkronisasi status kurir:** `trackBiteshipWaybill` ada di `src/lib/biteship.ts` tetapi tidak dipanggil dari mana pun; tidak ada webhook Biteship. Pelacakan masih manual — merchant mengisi resi dan mengubah status (`updateOrderTracking`). Tidak ditemukan pembuatan pesanan kurir (booking) lewat API Biteship.
- Rekonsiliasi terjadwal: satu-satunya cron adalah `purge-audit-logs`; belum ada laporan/rekonsiliasi settlement DOKU.
- Uji siklus pesanan end-to-end belum terdokumentasi.
- Refund/pembatalan pesanan berbayar masih manual (dicatat sebagai `ponytail` di `data-store.ts`).
- **Bug ditemukan:** notifikasi WhatsApp status pesanan di `src/app/actions/orders.ts:138` memakai nomor penerima hardcoded `628123456789`, bukan nomor pembeli. Nomor placeholder serupa juga ada di `FloatingChat.tsx` dan `TransactionsTab.tsx`.

## 4. Peningkatan LMS — 🟢

**Terverifikasi ada:** progres tontonan disimpan server-side dengan penguncian modul dan pembatasan seek maju (`lms-rules.ts`, `saveWatchProgress`), penyelesaian modul terakhir menerbitkan sertifikat dengan serial acak kriptografis, halaman sertifikat publik, CMS kursus (modul, template sertifikat, durasi YouTube otomatis), cache `lms:*` dengan invalidasi tiap mutasi admin, dan tes `lms-rules.test.ts`.

**Belum terverifikasi:** peningkatan UX navigasi kursus bersifat subjektif — perlu review manual di browser.

## 5. Kepatuhan Pajak Indonesia — ❌

Tidak ada progres. Skema hanya memiliki `Community.nomorNpwp` (data legal komunitas). Tidak ada field PPN/DPP/NPWP pada model `Order`/invoice, tidak ada faktur pajak/e-Faktur, dan tidak ada draf ekspor pelaporan. Halaman `/orders/[id]/invoice` hanya cetak invoice tanpa unsur pajak.

## 6. Inisiasi ISO 27001 — 🟡

**Kontrol teknis — terverifikasi tertutup (dibanding Gap Analysis 9 Sep):**
- Login tidak lagi jatuh ke kredensial seed: fallback mock dimatikan di produksi (`MOCK_FALLBACK = NODE_ENV !== 'production'`).
- Fallback secret JWT dihapus; hashing password bcrypt (`password.ts`), hash SHA-256 lama diupgrade saat login berikutnya.
- Pemeriksaan kepemilikan pada layanan, produk anggota, savings, dan CRUD konten komunitas; `logAudit` bukan lagi server action yang bisa dipanggil publik; `purgeExpiredAuditLogsAction` dijaga.
- Rate limiting berbasis database untuk login dan reset password; `db_error_log.txt` masuk `.gitignore`; log Didit dan WhatsApp tidak lagi memuat PII; penghapusan file KTP/selfie saat user dihapus.

**Masih terbuka:**
- `npm audit`: 36 kerentanan (0 kritis, 28 tinggi, 7 sedang, 1 rendah). Kritis sudah hilang, tetapi jumlah "tinggi" naik dari 9 ke 28.
- CSP baru mode `Report-Only`, belum enforcing.
- Hash SHA-256 lama tetap valid untuk akun yang belum login ulang (migrasi malas).
- **Dokumen ISMS belum ada:** risk register, Statement of Applicability, kebijakan keamanan informasi, inventaris aset, penanggung jawab & linimasa sertifikasi. Artefak "ISO 27001 Gap Analysis" hanya menilai kontrol teknis.

## 7. Peningkatan Sistem Verifikasi — 🟢

Alur Didit lengkap (`/api/kyc/didit`, `/api/didit/webhook`, `/api/kyc/status`), route simulasi dikunci di luar produksi, log webhook hanya memuat ID. Sisa kecil: stub lama `submitKycAction` (unggah KTP manual) masih ada di `community.ts`, dan audit titik kegagalan belum didokumentasikan.

---

## Carry-over ke Oktober (urut prioritas)

1. **Pembayaran & Pengiriman:** sambungkan pelacakan Biteship (poll/webhook → `OrderTracking`), booking kurir via API, rekonsiliasi settlement DOKU, uji siklus pesanan penuh; perbaiki nomor WA hardcoded di `orders.ts`.
2. **Snackbox v1:** hubungkan Order History/Coverage/Payout ke database, QA slider & pencarian kategori, bug bash, lalu deklarasikan rilis.
3. **Komunitas:** bangun 10 modul placeholder (atau sembunyikan lewat Feature Control sampai siap), QA mobile, feature-freeze; putuskan lingkup Phase 6.
4. **Pajak:** tentukan cakupan PPN/e-Faktur, tambahkan field ke Order/invoice, draf ekspor, tinjauan legal.
5. **ISO 27001:** tetapkan PIC, tulis risk register + SoA + kebijakan, inventaris aset; tangani `npm audit` (28 tinggi) dan ubah CSP ke mode enforcing.
6. **Retro September & draf rencana Oktober** (butir Minggu E roadmap) — tidak ada jejaknya di repo; dokumen ini bisa jadi bahan awalnya.
