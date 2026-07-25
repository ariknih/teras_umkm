# Design Spec: Sistem Pembagian SHU (Sisa Hasil Usaha) Koperasi Multi-Komunitas

## Executive Summary
Sistem Pembagian Sisa Hasil Usaha (SHU) Koperasi dirancang sesuai regulasi Undang-Undang Perkoperasian Indonesia dan petunjuk pelaksanaan Kementerian Koperasi. Sistem ini fleksibel (tanpa hardcoded/dummy percentage) dan mendukung multi-komunitas/multi-koperasi. Pengurus koperasi menentukan persentase alokasi komponen SHU berdasarkan keputusan Rapat Anggota Tahunan (RAT) melalui Admin Panel, dan sistem secara otomatis menghitung pembagian secara proporsional hingga ke masing-masing anggota berdasarkan Jasa Modal (Simpanan) dan Jasa Usaha (Transaksi).

---

## Technical Architecture & Flow

```mermaid
flowchart TD
    A[Admin Panel / RAT Config] -->|Input Laba Bersih & 9 Komposisi Persentase| B[Server Action: calculateAndSaveShuAction]
    B --> C[Service Layer: src/lib/shu-calculator.ts]
    C -->|Fetch Data Simpanan Anggota| D[DataStore: Users in Community]
    C -->|Fetch Data Omset Transaksi Anggota| E[DataStore: Completed Orders in Year]
    C -->|Hitung Proporsional SHU Jasa Modal & Jasa Usaha| F[Formula Engine]
    F -->|Simpan Snapshot Audit| G[DB: ShuConfig & ShuMemberDistribution]
    G -->|Realtime Query| H[Community Member Dashboard /community/[id]]
```

---

## Key Components

### 1. Database Schema (`prisma/schema.prisma` & `src/lib/data-store.ts`)
- **`ShuConfig`**: Menyimpan parameter RAT per komunitas dan periode tahun.
  - `communityId`: ID Komunitas Induk Koperasi.
  - `year`: Tahun buku RAT (e.g. `2026`).
  - `totalNetProfit`: Laba bersih / SHU Kotor Koperasi (Rp).
  - Alokasi persentase komponen (Must sum to 100%):
    - `pctCadangan`: Cadangan Koperasi.
    - `pctJasaModal`: SHU Anggota berdasarkan Jasa Modal / Simpanan.
    - `pctJasaUsaha`: SHU Anggota berdasarkan Jasa Usaha / Transaksi.
    - `pctPengurus`: Dana Pengurus.
    - `pctPengawas`: Dana Pengawas.
    - `pctKaryawan`: Dana Karyawan.
    - `pctPendidikan`: Dana Pendidikan Koperasi.
    - `pctSosial`: Dana Sosial.
    - `pctPembangunanDaerah`: Dana Pembangunan Daerah Kerja.

- **`ShuMemberDistribution`**: Menyimpan hasil kalkulasi SHU per anggota per periode.
  - `shuConfigId`, `communityId`, `userId`, `year`.
  - `simpananMember`: Total simpanan anggota (`simpananPokok + simpananWajib`).
  - `simpananTotalCommunity`: Total simpanan seluruh anggota dalam komunitas.
  - `shuJasaModalAmount`: Nominal SHU dari Jasa Modal.
  - `transaksiMember`: Total omset/transaksi belanja anggota pada periode.
  - `transaksiTotalCommunity`: Total omset/transaksi seluruh anggota dalam komunitas.
  - `shuJasaUsahaAmount`: Nominal SHU dari Jasa Usaha.
  - `totalShuAmount`: Total SHU yang diterima anggota (`shuJasaModalAmount + shuJasaUsahaAmount`).

---

## Formula Perhitungan Proporsional (UU Koperasi)

1. **Nominal Alokasi Komponen**:
   $$\text{Nominal Komponen} = \text{Laba Bersih (SHU Kotor)} \times \left(\frac{\text{Persentase Komponen}}{100}\right)$$

2. **SHU Jasa Modal Anggota $i$**:
   $$\text{SHU Jasa Modal}_i = \left(\frac{\text{Simpanan Anggota}_i}{\text{Total Simpanan Seluruh Anggota}}\right) \times \text{Nominal Alokasi Jasa Modal}$$

3. **SHU Jasa Usaha Anggota $i$**:
   $$\text{SHU Jasa Usaha}_i = \left(\frac{\text{Total Transaksi Anggota}_i}{\text{Total Transaksi Seluruh Anggota}}\right) \times \text{Nominal Alokasi Jasa Usaha}$$

4. **Total SHU Diterima Anggota $i$**:
   $$\text{Total SHU}_i = \text{SHU Jasa Modal}_i + \text{SHU Jasa Usaha}_i$$

---

## User Interfaces

### 1. Admin Panel - Modul Pengaturan & Kalkulator RAT SHU (`/admin`)
- Form konfigurasi pembagian SHU per komunitas & tahun buku.
- Dynamic input 9 komponen dengan real-time total percentage validator (Wajib 100%).
- Tabel pratinjau nominal alokasi lembaga & rincian per anggota sebelum disimpan.
- Riwayat keputusan RAT SHU per tahun.

### 2. Community Dashboard Member View (`/community/[id]`)
- Panel Transparansi SHU Koperasi RAT (Laba Bersih, Cadangan, Dana Pendidikan, dll.).
- Kartu SHU Anggota Personal (Simpanan Saya, SHU Jasa Modal, Transaksi Saya, SHU Jasa Usaha, Total SHU Diterima).
