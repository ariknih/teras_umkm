# 🏪 Teras UMKM
> **Platform Ekosistem Digital Premium untuk Akselerasi Bisnis UMKM Indonesia**

Teras UMKM adalah platform *all-in-one* premium yang dirancang khusus untuk membantu pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia meningkatkan skala bisnis mereka secara digital. Platform ini mengintegrasikan **Marketplace**, **Katalog Jasa**, **LMS Academy**, **Affiliate Hub**, **Community Forum**, **Sistem E-Wallet**, dan **Landing Page Builder** dalam satu ekosistem yang modern dan interaktif.

---

## 🚀 Fitur Utama & Modul Sistem

### 1. 🛍️ Premium Marketplace & Katalog Jasa
* **Kategori Produk Komprehensif**: Mendukung produk fisik (kuliner, pakaian, kerajinan) serta produk jasa (desain grafis, IT/website, fotografi, dll.).
* **Pencarian Terintegrasi & Filter Cerdas**: Mempermudah pelanggan menemukan produk berdasarkan kategori, harga, dan kueri pencarian.
* **Integrasi Google Maps**: Menampilkan peta lokasi UMKM terdekat secara real-time untuk mendukung pembelian lokal.

### 2. 🎓 LMS Business Academy (Multi-Tier Access)
* **Kursus Bisnis Eksklusif**: Materi pembelajaran dari para ahli industri mengenai digital marketing, manajemen keuangan, branding, dan teknik pembuatan produk (misal: *Artisan Baking*).
* **Akses Berjenjang (Tiered Access)**: Akses materi kursus disesuaikan dengan level keanggotaan merchant (**Gold**, **Platinum**, dan **Diamond**).
* **Progress Tracking**: Pencatatan kemajuan belajar interaktif per lesson untuk setiap pengguna.

### 3. 🤝 Affiliate & Referral Hub (Multi-Tier Commission)
* **Pemasaran Berjejaring**: Pelanggan atau marketer dapat mempromosikan produk UMKM dan mendapatkan komisi secara otomatis.
* **Sistem Komisi Multi-Tier**: Pembagian komisi otomatis berjenjang berdasarkan level afiliasi rujukan pembeli.
* **Pohon Afiliasi (Affiliate Tree)**: Pelacakan relasi referral antar pengguna secara terstruktur.

### 4. 💬 Community Forum & Interaksi Sosial
* **Grup Komunitas**: Ruang diskusi khusus pelaku usaha untuk berbagi tips, info pameran, atau peluang kolaborasi.
* **Konten Kaya Media**: Anggota dapat membuat postingan dengan teks, gambar, video, dan kategori tertentu.
* **Interaksi Sosial**: Fitur Like, Komentar, dan bergabung ke grup komunitas secara real-time.

### 5. 💳 E-Wallet & Gerbang Pembayaran (Midtrans Gateway)
* **Dompet Digital Terintegrasi**: Setiap pengguna memiliki saldo wallet untuk melakukan deposit, penarikan, atau bertransaksi langsung di platform.
* **Integrasi Midtrans Sandbox**: Pembayaran aman menggunakan Snap API untuk mendukung kartu kredit, bank transfer, dan e-wallet (GoPay, ShopeePay, QRIS).
* **Ledger Transaksi**: Pencatatan riwayat transaksi keuangan secara transparan (Deposit, Withdrawal, Penjualan, Komisi).

### 6. 🛠️ Merchant Landing Page Builder
* **Template Desain Modern**: Pilihan tema instan untuk merchant seperti *Modern Gold*, *Glassmorphism*, dan *Neo-Brutalism*.
* **Customizer Drag-and-Drop & Konfigurasi**: Merchant dapat mengatur judul, bio, link Instagram, WhatsApp gateway, dan layout sections tanpa perlu coding.

### 7. 🎫 Support Ticket & Customer Service Hub
* **Ticketing System**: Pelanggan dapat membuat tiket aduan atau pertanyaan yang langsung masuk ke antrean Customer Service.
* **CS Agent Assignment**: Pembagian tiket otomatis ke agen CS yang sedang aktif untuk penanganan cepat.

---

## 🛠️ Teknologi & Arsitektur

Platform ini menggunakan teknologi modern untuk performa, skalabilitas, dan kemudahan pengembangan:

| Teknologi | Deskripsi |
| :--- | :--- |
| **Next.js 16 (App Router)** | Framework React utama dengan dukungan SSR, dynamic routing, dan Server Actions. |
| **TypeScript** | Penulisan kode yang aman dengan sistem tipe statis untuk mencegah error runtime. |
| **Tailwind CSS v4** | Sistem styling modern dan super cepat untuk visualisasi antarmuka premium. |
| **Prisma ORM & PostgreSQL** | Pemetaan database relasional yang kuat, aman, dan mudah dimigrasi. |
| **Midtrans Sandbox** | Payment gateway untuk simulasi transaksi finansial yang aman. |
| **RajaOngkir / Komerce API** | Simulasi kalkulasi ongkos kirim dan tracking ekspedisi nasional. |

---

## ⚙️ Cara Memulai (Local Development Setup)

### Prerequisites
* **Node.js** (v18 ke atas)
* **Docker Desktop** (untuk PostgreSQL)

### Langkah Instalasi

1. **Clone Repository & Instal Dependensi**
   ```bash
   git clone https://github.com/ariknih/teras_umkm.git
   cd teras_umkm
   npm install
   ```

2. **Konfigurasi Environment Variables (`.env`)**
   Salin file `.env.example` menjadi `.env` lalu sesuaikan kredensial berikut:
   ```env
   DATABASE_URL="postgresql://postgres:umkm123@localhost:5432/teras_umkm?schema=public"
   JWT_SECRET="super-secret-teras-umkm-key-2026"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Jalankan Database (Docker)**
   Pastikan Docker Desktop aktif, lalu jalankan container database:
   ```bash
   docker run --name teras-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=umkm123 -e POSTGRES_DB=teras_umkm -d postgres
   ```

4. **Sinkronisasi Schema Database (Prisma)**
   Jalankan push untuk menyinkronkan skema model ke PostgreSQL:
   ```bash
   npx prisma db push
   ```

5. **Jalankan Aplikasi Web**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📊 Database Schema Overview
Platform ini menggunakan model database relasional yang saling terhubung:
* **User**: Menyimpan data akun, tingkat level (gamifikasi), poin, konfigurasi landing page, dan relasi afiliasi.
* **Product**: Menyimpan katalog produk marketplace beserta kategori, stok, dan partner komisi.
* **Order & OrderItem**: Pencatatan transaksi belanja pembeli.
* **Course & Lesson**: Materi edukasi digital di LMS Academy.
* **Post & CommunityGroup**: Struktur forum interaktif.
* **Wallet & WalletTransaction**: Transaksi finansial internal.

---
*Dibuat dengan ❤️ untuk kemajuan UMKM Indonesia.*
