# Weekly Progress Update — Minggu A–B (1–12 Sep 2026)
_Disusun 9 September 2026, diperbarui 12 September 2026 — berdasarkan roadmap "Saloka September 2026" dan riwayat git repo `teras_umkm`._

Status per hari ini: Minggu B (7–13 Sep) sedang berjalan, mendekati akhir. Recap ini menilai target **Minggu A: Finalisasi Snackbox** dan kemajuan jalur lain, termasuk commit besar `49c0d07` (9 Sep malam) dan pekerjaan integrasi pembayaran serta perbaikan komunitas yang berlanjut sejak 10 Sep (masih belum di-commit).

---

## 🎯 Minggu A — Finalisasi Snackbox (target selesai 6 Sep)

**Definisi Selesai roadmap:** Snackbox v1 tayang dengan checkout, keranjang, dan pencarian yang telah sepenuhnya QA — tanpa bug penghambat.

**Status: 🟡 Progres signifikan, belum bisa disebut "v1 selesai".**

Tercapai:
- Pencarian kelurahan nasional + deteksi lokasi GPS/IP otomatis (5–6 Sep)
- **Commit `49c0d07` (9 Sep):** perombakan besar Snackbox — `page.tsx`, `SnackboxContext`, `SnackboxProductCard`, `SnackboxCategoryTabs`, `SnackboxHeader`, `SnackboxMerchantCTA`, dan `cart/page.tsx` dirapikan; data dummy `mock-snackbox.ts` dipangkas signifikan (378 baris); ditambahkan **deteksi ulang lokasi otomatis** (re-deteksi GPS/IP saat pengguna berpindah lebih dari radius tertentu) dengan penyimpanan metadata lokasi (`LocationMeta`)

Belum tercapai / belum ada bukti eksplisit:
- QA khusus pada slider bagi hasil 15–20% dan pencarian kategori merchant
- Bug bash menyeluruh yang terdokumentasi
- Pernyataan rilis resmi "Snackbox v1"

---

## 🎯 Finalisasi Sistem Komunitas (target Minggu B, 7–13 Sep)

**Status: 🟡 Maju pesat, plus hotfix arithmetic yang penting minggu ini.**

Sudah dikerjakan:
- Harga & badge komunitas berbayar + modal pembayaran, persistensi diskusi/galeri/produk ke database, restrukturisasi CMS admin, perbaikan performa N+1 (Minggu A, seperti dilaporkan sebelumnya)
- **Baru (belum di-commit):** hotfix perhitungan payout referral multi-tier (`src/lib/referral-payout.ts` + self-check `referral-payout.test.ts`) — memperbaiki bug mode NOMINAL yang salah dihitung sebagai persentase, dan kebocoran dana ke fallback penerima yang di-hardcode. Menegakkan invarian `joinFee = referralBudget + communityProfitShare`.
- Penyesuaian terkait di `shu-calculator.ts`, `community-referral.ts`, `community.ts`, `savings.ts`, `shu.ts`, `wallet/page.tsx`, `CommunityTab.tsx`, `CommunityDirectoryClient.tsx`, `CommunityDetailClient.tsx`, `LandingPageView.tsx` — menyambungkan payout/SHU yang sudah diperbaiki ke UI wallet & komunitas.
- **Terbaru (11–12 Sep, belum di-commit):** skema Prisma diperluas untuk menutup celah yang ditemukan hotfix referral —
  - `CommunityMembership.referrerId` — mencatat siapa yang mereferensikan anggota **untuk komunitas ini secara spesifik** saat join, terpisah dari `User.parentAffiliateId` (referrer platform-wide yang menggerakkan komisi penjualan produk).
  - `Community.commissionMethod` (`PERCENTAGE`/`NOMINAL`) — field skema resmi untuk mode yang sebelumnya jadi sumber bug di `referral-payout.ts`.
  - `Community.isRecruitmentLocked` — rekrutmen anggota baru bisa dikunci manual/otomatis (mis. kas coin komunitas habis).
  - `CoinTransaction.orderId` dan `CooperativeSavingsTransaction.orderId` (keduanya `@unique`) — mencegah replay webhook payment gateway meng-kredit saldo/simpanan dua kali.
  - Refactor besar `data-store.ts` (+987/-390 baris) menyambungkan seluruh field baru ke Prisma mutations.
- **Konsolidasi badge & template komunitas (baru, belum di-commit):** `src/lib/community-badge.ts` jadi single source of truth label badge tipe/tier komunitas (dulu dihitung terpisah di directory, landing page, dan banner Beranda sehingga bisa tidak sinkron). `src/lib/community-templates.ts` jadi single source of truth modul navigasi per template Perkumpulan (Society/Business/Education/Culinary), dipakai bersama oleh tab Pengaturan client dan action pembuatan komunitas server.
- **Fitur baru:** `CommunityNavLink.tsx` + `CommunityPickerModal.tsx` — pengalih cepat antar komunitas yang diikuti pengguna, ditampilkan di navigasi.

Belum dikerjakan sesuai Definisi Selesai roadmap:
- QA menyeluruh mobile untuk seluruh 11 modul
- Sign-off & feature-freeze resmi

---

## 🎯 Integrasi Pembayaran & Pengiriman (target Minggu C, 14–20 Sep)

**Status: 🟡 Mulai lebih awal dari jadwal — fondasi gateway sudah ada.**

- **DOKU telah menyetujui aplikasi merchant kita** — akun DOKU kini tersedia untuk digunakan (masih perlu verifikasi sebelum produksi).
- Dibangun `src/lib/payment-gateway.ts`: lapisan abstraksi vendor-agnostic di atas DOKU dan Midtrans, sehingga route API (`/api/payment/checkout`, `/api/payment/verify`) tidak pernah bicara langsung ke `doku.ts`/`midtrans.ts`. Menukar gateway aktif cukup ubah satu env var (`PAYMENT_GATEWAY_PRIMARY`), tanpa ubah route atau UI.
- `src/lib/doku.ts` — klien DOKU lengkap dengan skema signature HMAC-SHA256 resmi mereka.
- `src/lib/payment-purposes.ts` — logika bisnis checkout per tujuan (`JOIN_FEE`, `SAVINGS`, `COIN_TOPUP`), independen dari vendor gateway.
- Saat ini `PAYMENT_GATEWAY_PRIMARY=MIDTRANS` (default) karena akun DOKU belum diverifikasi penuh untuk produksi.
- **Terbaru (11–12 Sep):** route API sudah diimplementasikan penuh, bukan lagi kerangka —
  - `/api/payment/checkout` (124 baris) & `/api/payment/verify` (138 baris) — route generik yang bicara ke gateway aktif lewat `payment-gateway.ts`.
  - `/api/doku/checkout` (46 baris) & `/api/doku/verify` (92 baris) — jalur khusus DOKU dengan verifikasi signature HMAC-SHA256.
  - Idempotensi di level database: `orderId` unik pada `CoinTransaction` & `CooperativeSavingsTransaction` memastikan verify call yang di-replay (retry webhook, race condition) tidak meng-kredit saldo dua kali.
- Seluruh pekerjaan ini **belum di-commit** ke branch.

Belum dikerjakan:
- Sinkronisasi status pelacakan kurir/pengiriman
- Pipeline status pesanan → pembayaran → pengiriman untuk alur checkout marketplace utama (gateway ini baru menutup join-fee/savings/coin-topup, belum checkout pesanan produk)
- Penanganan webhook rekonsiliasi untuk DOKU secara end-to-end di produksi

## 🎯 Peningkatan LMS (target Minggu D, 21–27 Sep)

**Status: 🟡 Mulai lebih awal dari jadwal.** Tidak ada perubahan baru minggu ini di luar yang sudah dilaporkan (sertifikat, aturan video LMS, manajemen kursus CMS). Belum ada: peningkatan UX navigasi kursus, optimasi performa/caching halaman LMS.

## 🎯 Kepatuhan Pajak Indonesia (jalur paralel, berjalan sepanjang bulan)

**Status: ❌ Belum ada progres.** Tidak ditemukan commit terkait field pajak, invoice PPN/e-Faktur, atau draf pelaporan.

## 🎯 Inisiasi ISO 27001 (jalur paralel)

**Status: 🟢 Fondasi teknis kini resmi ter-commit (`49c0d07`, 9 Sep).**
- Audit log (`src/lib/audit-log.ts`) dan tab Audit Log CMS admin dirombak
- Guard otorisasi terpusat (`src/lib/auth-guards.ts`)
- Rate limiting endpoint API (`src/lib/rate-limit.ts`)
- Hashing password dengan bcrypt (`src/lib/password.ts`)
- Penghapusan file upload yang aman lintas provider (`src/lib/delete-upload.ts`)
- Cron job harian pembersihan audit log (`vercel.json`, `src/app/api/cron/purge-audit-logs`)

Ini bukan gap assessment atau kebijakan formal ISO 27001, tapi kontrol keamanan teknis yang mendukungnya sudah **dirilis** (bukan sekadar draf di working tree seperti laporan minggu lalu). Belum ada: gap assessment terdokumentasi, draf kerangka kebijakan, penunjukan penanggung jawab sertifikasi.

## 🎯 Peningkatan Sistem Verifikasi (jalur paralel)

**Status: 🟢 Perbaikan reliabilitas ter-commit.** Perubahan pada `auth.ts` (+247 baris), webhook Didit, dan route status/simulasi KYC dari laporan minggu lalu kini sudah masuk commit `49c0d07` — bukan lagi sekadar perubahan belum tersimpan.

---

## Ringkasan

| Inisiatif | Target Minggu Ini | Status |
|---|---|---|
| Snackbox v1 | Minggu A (selesai 6 Sep) | 🟡 Perombakan besar ter-commit, belum ada rilis v1 resmi |
| Sistem Komunitas | Minggu B (s.d. 13 Sep) | 🟡 Maju pesat + hotfix payout referral, skema referrer/idempotensi baru, konsolidasi badge/template; QA & freeze belum |
| Pembayaran & Pengiriman | Minggu C | 🟡 Mulai lebih awal — route checkout/verify DOKU & Midtrans lengkap dengan idempotensi; shipping belum |
| LMS | Minggu D | 🟡 Mulai lebih awal (sertifikat & CMS kursus rilis) |
| Pajak | Berjalan sepanjang bulan | ❌ Belum ada progres |
| ISO 27001 | Berjalan sepanjang bulan | 🟢 Kontrol teknis ter-commit; gap assessment formal belum |
| Verifikasi | Berjalan sepanjang bulan | 🟢 Perbaikan reliabilitas ter-commit |

**Kabar baik:** DOKU menyetujui aplikasi merchant kita — membuka jalur produksi payment gateway kedua begitu verifikasi akun selesai.

**Risiko utama:** Snackbox v1 — prioritas #1 roadmap — masih belum dinyatakan selesai meski sudah dirombak signifikan. Working tree kini menumpuk pekerjaan besar yang belum di-commit selama 3 hari berturut-turut: integrasi pembayaran (route checkout/verify DOKU & Midtrans lengkap dengan idempotensi database), hotfix payout referral komunitas, perubahan skema Prisma (`referrerId`, `commissionMethod`, `isRecruitmentLocked`, `orderId` unik), dan konsolidasi badge/template komunitas. Semakin lama tidak di-commit, semakin besar risiko konflik merge atau kehilangan pekerjaan — prioritaskan review & commit sebelum menambah perubahan baru di atasnya.
