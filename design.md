---
name: Saloka.id Brand & Component Specification
description: Panduan Desain Identitas Visual Mutlak dan Aturan Interaksi Saloka.id untuk Developer dan AI Generation (Stitch)
colors:
  primary: "#2DB24A"     # Hijau Utama - Melambangkan pertumbuhan, kesegaran, keandalan UMKM
  secondary: "#0F5132"   # Hijau Tua - Mewakili stabilitas, keandalan, profesionalisme, kontras utama
  tertiary: "#FFC107"    # Kuning/Accent - Memberi kesan optimis, ceria, aktif (Aksen .id & CTA utama)
  background: "#F5F7F9"  # Soft Off-White - Untuk area canvas, netral & bersih meningkatkan fokus konten
  surface: "#FFFFFF"     # Putih - Untuk background card, modal, dan elemen penampung
  text-primary: "#111111"# Hitam - Untuk teks utama/heading (Kontras rasio 17.5:1, Lulus WCAG AAA)
  text-secondary: "#6B7280" # Abu-abu - Menyeimbangkan tampilan, untuk teks penjelas/caption
  border: "#E5E7EB"      # Subtle Gray Border - Untuk hairline stroke pemisah antar elemen
  success: "#2DB24A"     # Hijau Semantik - Indikator sukses, terverifikasi, aktif
  warning: "#FFC107"     # Kuning Semantik - Indikator peringatan/proses tertunda
  error: "#DC2626"       # Merah Semantik - Indikator error, gagal verifikasi, nominal tagihan
typography:
  fontFamily: "Poppins, Poppins Rounded, sans-serif"
  h1:
    fontSize: "2.25rem" # 36px untuk Headline Utama Desktop
    fontWeight: "700"   # Bold
    lineHeight: "1.2"
    letterSpacing: "-0.015em"
  h2:
    fontSize: "1.75rem" # 28px untuk Judul Section Form / Hero Sub
    fontWeight: "600"   # Semibold
    lineHeight: "1.3"
  body-md:
    fontSize: "0.875rem" # 14px untuk Teks Deskripsi & Input Form
    fontWeight: "400"    # Regular / Medium
    lineHeight: "1.6"
  label-sm:
    fontSize: "0.75rem" # 12px untuk Label Form, Teks Info Muted
    fontWeight: "500"   # Medium
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
    fontFamily: "{typography.fontFamily}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-cta-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
    fontWeight: "700"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.border}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
    border: "1px solid {colors.border}"
---

## 1. Overview & Brand Personality

Saloka.id hadir sebagai platform marketplace komunitas modern yang ramah, profesional, dan tepercaya untuk produk lokal berkualitas tinggi. Pendekatan visual wajib menggabungkan nuansa "Natural-Organic" yang segar dengan kepraktisan antarmuka SaaS modern.

Desain menekankan pada keterbacaan tingkat tinggi, bentuk elemen bersudut membulat lembut (friendly rounded corners), serta pemanfaatan ruang kosong (whitespace) yang lega untuk meminimalkan beban kognitif pengguna (cognitive load), khususnya pada formulir registrasi yang kompleks.

## 2. Warna & Kontras (Color System)

Semua implementasi warna wajib mengacu secara mutlak pada panduan identitas visual:

- **Hijau Utama (#2DB24A)**: Hanya digunakan sebagai penunjuk aksi utama (Primary Buttons, Lencana Sukses, Elemen Visual Kunci). Melambangkan pertumbuhan dan energi positif.
- **Hijau Tua (#0F5132)**: Digunakan untuk teks headline penting, background header/banner, serta tombol sekunder guna menjamin rasio kontras yang solid di atas latar belakang terang.
- **Kuning (#FFC107)**: Digunakan secara eksklusif sebagai aksen identitas (.id), lencana promo aktif, dan tombol aksi tertinggi (Call to Action / CTA) seperti tombol "Belanja Sekarang".
- **Hitam (#111111)**: Digunakan untuk teks tubuh (body copy) dan judul form guna mencapai tingkat kontras maksimum dan menjamin aksesibilitas penuh bagi semua rentang audiens.
- **Abu-abu (#6B7280)**: Untuk mendesain elemen teks sekunder, ikon dinonaktifkan, border, dan teks petunjuk (placeholder).

## 3. Tipografi (Typography)

- **Primary Font Family**: Poppins atau Poppins Rounded dengan fallback sans-serif.
- **Saloka Brand Identity Typography**:
  - Kata "**Saloka**" ditulis menggunakan tipe Poppins Bold dengan warna Hijau Tua (#0F5132).
  - Ekstensi "**.id**" ditulis menggunakan tipe Poppins Bold dengan warna Kuning (#FFC107).
- **Tagline & Body Copy Hierarchy**:
  - Heading 1/Headline menggunakan tipe Poppins Bold (700).
  - Body Text/Deskripsi menggunakan tipe Poppins Regular (400) atau Poppins Medium (500) dengan warna abu-abu #6B7280 guna memelihara keseimbangan estetika ramah dan profesional.

## 4. Spacing, Shapes, & Layout Rhythm

Sistem ini menggunakan basis grid kelipatan 8px (8, 16, 24, 32, 48, 64) guna memastikan konsistensi ritme visual di seluruh perangkat (Mobile, Tablet, Desktop).

- **Layout Landing Page**: Dibuat seminimal dan sesederhana mungkin. Fokus langsung diarahkan ke Tagline Utama, Visual Produk, dan dua tombol aksi (CTA) yang jelas.
- **Bentuk Sudut (Border Radius)**:
  - Tombol CTA utama menggunakan bentuk Full Pill/Capsule (rounded-full / 9999px) untuk kenyamanan ketukan pada layar sentuh.
  - Card fungsional, kontainer form, serta kolom input wajib menggunakan sudut membulat lebar 12px hingga 16px sesuai dengan visual pemandu guna mendukung vibe yang ramah (playful yet trustworthy).

## 5. Komponen Interaktif & Alur Registrasi Baru (Revisi Arik)

Semua komponen formulir baru yang diminta oleh klien (Arik) dikelompokkan dalam alur langkah terstruktur berikut:

### 5.1 Tipe Pendaftaran (Koperasi Berbayar vs Reguler)

- **Komponen**: Radio selector dalam bentuk Card interaktif bersisi ganda.
- **Logika Visual**:
  - Jika tipe "Koperasi" aktif, tampilkan form upload berkas legalitas serta modul tagihan iuran pendaftaran instan di bagian bawah senilai Rp 150.000.
  - Sediakan metode bayar interaktif (QRIS & Bank Transfer) di bawah rincian tagihan secara dinamis.

### 5.2 Verifikasi Kontak via WhatsApp

- **Komponen**: Kolom input nomor HP dengan inline prefix +62 dipadu tombol solid "Kirim Kode".
- **Logika Visual**: Begitu ditekan, modul verifikasi OTP 4-digit akan terbuka meluncur di bawahnya secara presisi lengkap dengan visualisasi hitung mundur (countdown timer) 60 detik.

### 5.3 Konfigurasi Subdomain & Custom Domain

- **Komponen**: Dual-card input untuk penentuan alamat web komunitas.
  - **Input 1**: Subdomain Saloka gratis ([nama].saloka.id).
  - **Input 2**: Alamat domain kustom berbayar/pro (www.domainanda.com).
- **Logika Visual**: Sediakan panel penampung dinamis (Live Domain Preview) yang mendeteksi masukan ketikan pengguna secara langsung dan menampilkan alamat lengkap protokol aman https:// secara real-time.

### 5.4 Kolom Referral & Affiliate

- **Komponen**: Kolom input opsional dengan visual ikon tiket/voucher di sisi kiri dalam kolom input. Digunakan untuk menampung kode pengundang atau affiliate link afiliasi secara opsional.

## 6. Aturan Mutlak Yang Tidak Boleh Dilanggar (Rules to Never Break)

- DILARANG menggunakan warna hijau lain selain Hijau Utama (#2DB24A) dan Hijau Tua (#0F5132) yang tercantum dalam brand guide.
- DILARANG menggunakan tombol bersudut tajam siku-siku (0px radius). Semua tombol interaktif wajib membulat (rounded-xl atau rounded-full).
- DILARANG menyembunyikan opsi metode pembayaran koperasi jika user memilih tipe pendaftaran "Koperasi Berbayar". Rincian biaya iuran dasar wajib langsung tampil transparan di bagian bawah form.
- DILARANG menggunakan alert dialog bawaan peramban (native browser alert). Gunakan sistem notifikasi toast banner kustom melayang dengan background warna sekunder `#0F5132`.
