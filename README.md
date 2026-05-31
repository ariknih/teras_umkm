# 🏪 Teras UMKM

> **Premium Digital Ecosystem for Indonesian MSME Business Acceleration**  
> *Platform Ekosistem Digital Premium untuk Akselerasi Bisnis UMKM Indonesia*

---

### Language / Bahasa
* [English Version 🇬🇧](#english-version-)
* [Versi Bahasa Indonesia 🇮🇩](#versi-bahasa-indonesia-)

---

# English Version 🇬🇧

Teras UMKM is a premium all-in-one platform designed specifically to help Micro, Small, and Medium Enterprises (MSMEs) in Indonesia scale their businesses digitally. The platform integrates a **Marketplace**, **Service Directory**, **LMS Academy**, **Affiliate Hub**, **Community Forum**, **E-Wallet System**, and **Landing Page Builder** with modern GSAP scroll animations and interactive modal interfaces.

---

## 🚀 Key Features & System Modules

### 1. 🛍️ Premium Marketplace & Service Directory
* **Comprehensive Product Categories**: Supports both physical goods (culinary, fashion, crafts) and service listings (graphic design, web development, photography).
* **Smart Search & Filters**: Easy-to-use search parameters based on category, price, and query strings.
* **Google Maps Integration**: Displays real-time location mapping of nearby merchant shops for localized commerce.

### 2. 🎓 LMS Business Academy (Multi-Tier Access)
* **Exclusive Business Courses**: Educational tracks taught by industry experts in digital marketing, financial management, branding, and product creation.
* **Tiered Membership Access**: Course materials unlocked based on merchant membership tiers (**Gold**, **Platinum**, and **Diamond**).
* **Interactive Progress Tracking**: Tracks learning completion per lesson for every student.

### 3. 🤝 Affiliate & Referral Hub (Multi-Tier Commission)
* **Word-of-mouth Marketing**: Customers or marketing partners can promote merchant products and receive automatic commissions.
* **Multi-Tier Commission System**: Automated split-payout distribution based on referral tree levels.
* **Affiliate Tree Tracker**: Structured, graphical tree mapping and visualization of referral relationships.

### 4. 💬 Community Forum & Social Interactions
* **Community Groups**: Dedicated spaces for business owners to share tips, exhibition info, and collaboration opportunities.
* **Media-Rich Content**: Posts support rich text, images, videos, and custom categories.
* **Social Engagement**: Real-time Likes, Comments, and Join Group functionalities.

### 5. 💳 E-Wallet & Payment Gateway (Midtrans Integration)
* **Integrated Digital Wallet**: Internal balance system allowing deposits, withdrawals, and direct platform transactions.
* **Midtrans Sandbox Integration**: Secure payments powered by Midtrans Snap API supporting Credit Cards, Bank Transfers, and E-Wallets (GoPay, ShopeePay, QRIS).
* **Financial Ledger**: Transparent tracking of transaction history (Deposits, Withdrawals, Sales, Commissions).

### 6. 🛠️ Merchant Landing Page Builder
* **Modern Design Templates**: Instant styles including *Modern Gold*, *Glassmorphism*, and *Neo-Brutalism* (with thick borders and pop colors).
* **Real-time Live Customizer**: Merchants can customize headers, bios, Instagram links, WhatsApp gateways, and toggle layout sections with instant previews.

### 7. 🎫 Support Ticket & Customer Service Hub
* **Ticketing System**: Automated ticket queues for customer inquiries and complaints.
* **Active Agent Assignment**: Automated routing of tickets to online CS agents for rapid support.

---

## ✨ Premium UI & Interaction Enhancements

* **GSAP & ScrollTrigger Animations**: Advanced micro-interactions, split-text character reveal entries, stagger layouts, and smooth scroll effects.
* **Modal Dialog Authentication**: Clean, fast popup sign-in modals built with Radix / Shadcn Dialog to bypass unnecessary page redirects.
* **Password Strength Indicator**: Real-time feedback and security grading when registering accounts.
* **Contact Developer Integration**: Quick access to developer portfolio [arikporto.netlify.app](https://arikporto.netlify.app) built into the footer bar.

---

## 🛠️ Technology Stack & Architecture

| Tech | Description |
| :--- | :--- |
| **Next.js 16 (App Router)** | Primary React framework with SSR, dynamic routing, and Server Actions. |
| **TypeScript** | Strict static typing for robust, error-free runtime execution. |
| **Tailwind CSS v4** | Rapid utility-first styling powering the premium user interfaces. |
| **Prisma ORM & PostgreSQL** | Relational database modeling, migrations, and seed helpers. |
| **Midtrans Sandbox** | Simulated payment gateway integration. |
| **Komerce Shipping API** | Automated domestic shipping calculation and tracking simulation. |

---

## ⚙️ Local Development Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **Docker Desktop** (for hosting PostgreSQL locally)

### Installation Steps

1. **Clone the Repository & Install Dependencies**
   ```bash
   git clone https://github.com/ariknih/teras_umkm.git
   cd teras_umkm
   npm install
   ```

2. **Configure Environment Variables (`.env`)**
   Copy the provided `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

3. **Spin Up Database (Docker)**
   Start the PostgreSQL container:
   ```bash
   docker run --name teras-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=umkm123 -e POSTGRES_DB=teras_umkm -d postgres
   ```

4. **Sync Database Schema & Run Seeds (Prisma)**
   Synchronize Prisma schemas and load default mock datasets:
   ```bash
   npx prisma db push
   node prisma/seed-db.js
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Database Schema & Architecture PDF
* Read the complete entity relational database structures and workflows in [public/teras_umkm_erd_flowchart.pdf](file:///d:/PROJECT/teras_umkm/public/teras_umkm_erd_flowchart.pdf).

---

# Versi Bahasa Indonesia 🇮🇩

Teras UMKM adalah platform *all-in-one* premium yang dirancang khusus untuk membantu pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia meningkatkan skala bisnis mereka secara digital. Platform ini mengintegrasikan **Marketplace**, **Katalog Jasa**, **LMS Academy**, **Affiliate Hub**, **Community Forum**, **Sistem E-Wallet**, dan **Landing Page Builder** dengan animasi scroll GSAP modern dan antarmuka modal interaktif.

---

## 🚀 Fitur Utama & Modul Sistem

### 1. 🛍️ Premium Marketplace & Katalog Jasa
* **Kategori Produk Komprehensif**: Mendukung produk fisik (kuliner, pakaian, kerajinan) serta produk jasa (desain grafis, IT/website, fotografi, dll.).
* **Pencarian Terintegrasi & Filter Cerdas**: Mempermudah pelanggan menemukan produk berdasarkan kategori, harga, dan kueri pencarian.
* **Integrasi Google Maps**: Menampilkan peta lokasi UMKM terdekat secara real-time untuk mendukung pembelian lokal.

### 2. 🎓 LMS Business Academy (Multi-Tier Access)
* **Kursus Bisnis Eksklusif**: Materi pembelajaran dari para ahli industri mengenai digital marketing, manajemen keuangan, branding, dan teknik pembuatan produk.
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
* **Template Desain Modern**: Pilihan tema instan untuk merchant seperti *Modern Gold*, *Glassmorphism*, dan *Neo-Brutalism* (dengan pinggiran tebal dan warna pop).
* **Live Customizer Real-time**: Merchant dapat mengatur judul, bio, link Instagram, WhatsApp gateway, dan layout sections dengan pratinjau langsung instan.

### 7. 🎫 Support Ticket & Customer Service Hub
* **Ticketing System**: Pelanggan dapat membuat tiket aduan atau pertanyaan yang langsung masuk ke antrean Customer Service.
* **CS Agent Assignment**: Pembagian tiket otomatis ke agen CS yang sedang aktif untuk penanganan cepat.

---

## ✨ Fitur Visual Premium & Interaksi

* **Animasi GSAP & ScrollTrigger**: Penambahan micro-animation, efek pecah karakter teks dinamis, dan efek transisi entry layout yang smooth.
* **Autentikasi Modal Dialog**: Proses login instan menggunakan modul popup Radix / Shadcn Dialog tanpa mengalihkan halaman pengguna.
* **Indikator Kekuatan Sandi**: Penilaian kemanan kata sandi secara real-time saat registrasi akun baru.
* **Kontak Developer Terintegrasi**: Akses cepat menuju halaman portofolio pengembang [arikporto.netlify.app](https://arikporto.netlify.app) yang disematkan pada bar footer.

---

## 🛠️ Teknologi & Arsitektur

| Teknologi | Deskripsi |
| :--- | :--- |
| **Next.js 16 (App Router)** | Framework React utama dengan dukungan SSR, dynamic routing, dan Server Actions. |
| **TypeScript** | Penulisan kode yang aman dengan sistem tipe statis untuk mencegah error runtime. |
| **Tailwind CSS v4** | Sistem styling modern dan super cepat untuk visualisasi antarmuka premium. |
| **Prisma ORM & PostgreSQL** | Pemetaan database relasional yang kuat, aman, dan mudah dimigrasi. |
| **Midtrans Sandbox** | Payment gateway untuk simulasi transaksi finansial yang aman. |
| **Komerce Shipping API** | Simulasi kalkulasi ongkos kirim dan tracking ekspedisi nasional. |

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
   ```bash
   cp .env.example .env
   ```

3. **Jalankan Database (Docker)**
   Pastikan Docker Desktop aktif, lalu jalankan container database:
   ```bash
   docker run --name teras-postgres -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=umkm123 -e POSTGRES_DB=teras_umkm -d postgres
   ```

4. **Sinkronisasi Schema Database & Jalankan Seeds (Prisma)**
   Jalankan push skema model dan isi data demo awal ke PostgreSQL:
   ```bash
   npx prisma db push
   node prisma/seed-db.js
   ```

5. **Jalankan Aplikasi Web**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📊 Database Schema & Diagram Alur PDF
* Struktur lengkap entity relational database serta alur proses sistem dapat dilihat di berkas dokumen [public/teras_umkm_erd_flowchart.pdf](file:///d:/PROJECT/teras_umkm/public/teras_umkm_erd_flowchart.pdf).

---
*Dibuat dengan ❤️ untuk kemajuan UMKM Indonesia.*
