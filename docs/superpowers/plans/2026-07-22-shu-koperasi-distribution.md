# SHU Koperasi Distribution System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dynamic, regulation-compliant Sisa Hasil Usaha (SHU) distribution module for Indonesian Cooperatives (Koperasi) that calculates member SHU based on Proportional Capital Contribution (Jasa Modal) and Transaction Activity (Jasa Usaha) configured per community RAT decision.

**Architecture:** Prisma models (`ShuConfig` & `ShuMemberDistribution`), backend formula engine (`src/lib/shu-calculator.ts`), Server Actions (`src/app/actions/shu.ts`), Admin RAT Configurator UI, and Real-time Community Dashboard displays.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma ORM, TypeScript, TailwindCSS.

## Global Constraints
- **Dynamic Configuration**: No hardcoded percentages or dummy data. All percentages must be configurable per community and year.
- **Validation**: Sum of 9 SHU allocation components MUST strictly equal 100%.
- **Proportional Member Calculation**:
  - $\text{SHU Jasa Modal} = \left(\frac{\text{Simpanan Anggota}}{\text{Total Simpanan Komunitas}}\right) \times \text{Alokasi SHU Jasa Modal}$
  - $\text{SHU Jasa Usaha} = \left(\frac{\text{Transaksi Anggota}}{\text{Total Transaksi Komunitas}}\right) \times \text{Alokasi SHU Jasa Usaha}$

---

### Task 1: Prisma Schema & DataStore Infrastructure for SHU

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/data-store.ts`

**Interfaces:**
- Produces: `DataStore.upsertShuConfig()`, `DataStore.saveShuMemberDistributions()`, `DataStore.getShuConfig()`, `DataStore.getMemberShu()`

- [ ] **Step 1: Update `prisma/schema.prisma` with `ShuConfig` and `ShuMemberDistribution` models**

```prisma
model ShuConfig {
  id                    String                 @id @default(cuid())
  communityId           String
  year                  Int
  totalNetProfit        Float
  pctCadangan           Float                  @default(25.0)
  pctJasaModal          Float                  @default(20.0)
  pctJasaUsaha          Float                  @default(30.0)
  pctPengurus           Float                  @default(10.0)
  pctPengawas           Float                  @default(5.0)
  pctKaryawan           Float                  @default(5.0)
  pctPendidikan         Float                  @default(2.5)
  pctSosial             Float                  @default(2.5)
  pctPembangunanDaerah Float                  @default(0.0)
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  distributions         ShuMemberDistribution[]

  @@unique([communityId, year])
}

model ShuMemberDistribution {
  id                      String    @id @default(cuid())
  shuConfigId             String
  communityId             String
  userId                  String
  year                    Int
  simpananMember          Float
  simpananTotalCommunity  Float
  shuJasaModalAmount      Float
  transaksiMember         Float
  transaksiTotalCommunity Float
  shuJasaUsahaAmount      Float
  totalShuAmount          Float
  createdAt               DateTime  @default(now())

  shuConfig               ShuConfig @relation(fields: [shuConfigId], references: [id], onDelete: Cascade)

  @@unique([shuConfigId, userId])
}
```

- [ ] **Step 2: Run `npx prisma generate` to update Prisma Client**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Add SHU DataStore helper methods in `src/lib/data-store.ts`**

Add methods in `DataStore`:
- `upsertShuConfig(data)`
- `saveShuMemberDistributions(configId, distributions)`
- `getShuConfigByCommunityAndYear(communityId, year)`
- `getMemberShuDistribution(userId, communityId, year)`
- `getCommunityShuHistory(communityId)`

- [ ] **Step 4: Commit Task 1**

```bash
git add prisma/schema.prisma src/lib/data-store.ts
git commit -m "feat(shu): add ShuConfig and ShuMemberDistribution Prisma models and DataStore methods"
```

---

### Task 2: Backend Calculation Engine & Server Actions

**Files:**
- Create: `src/lib/shu-calculator.ts`
- Create: `src/app/actions/shu.ts`

**Interfaces:**
- Consumes: `DataStore` methods from Task 1
- Produces: `calculateAndSaveShuDistribution()`, `getCommunityShuDataAction()`, `getUserShuSummaryAction()`

- [ ] **Step 1: Create formula engine in `src/lib/shu-calculator.ts`**

Implement `calculateShuDistribution`:
- Validates that sum of 9 percentages equals 100.
- Computes nominal amounts for each component based on `totalNetProfit`.
- Fetches all users registered in `communityId`.
- Calculates `simpananMember = simpananPokok + simpananWajib` and `simpananTotalCommunity`.
- Calculates `transaksiMember` (sum of completed orders for that year) and `transaksiTotalCommunity`.
- Computes `shuJasaModalAmount` and `shuJasaUsahaAmount` for each user.
- Saves config and member distributions via `DataStore`.

- [ ] **Step 2: Create Server Actions in `src/app/actions/shu.ts`**

Export:
- `calculateAndSaveShuAction(formData)`
- `getCommunityShuDataAction(communityId, year)`
- `getUserShuSummaryAction(userId, communityId)`

- [ ] **Step 3: Commit Task 2**

```bash
git add src/lib/shu-calculator.ts src/app/actions/shu.ts
git commit -m "feat(shu): add SHU formula engine and server actions"
```

---

### Task 3: Admin Panel SHU Configurator & Management Tab

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx`

**Interfaces:**
- Consumes: `calculateAndSaveShuAction` and `getCommunityShuDataAction` from Task 2
- Produces: Admin Panel SHU RAT Configurator interface and member breakdown table

- [ ] **Step 1: Add SHU RAT Configurator tab to Admin Dashboard navigation**

Add menu item `shu` to sidebar navigation items in `AdminDashboardClient.tsx`.

- [ ] **Step 2: Build SHU RAT Percentage Configurator Form & Live Nominal Preview Table**

Render:
- Community Selector & Year Selector
- Total Laba Bersih (SHU Kotor) Input
- 9 Percentage Inputs (Cadangan, Jasa Modal, Jasa Usaha, Pengurus, Pengawas, Karyawan, Pendidikan, Sosial, Pembangunan Daerah)
- Live Total Percentage Indicator (Green if 100%, Red if != 100%)
- Breakdown Table showing nominal allocation per component
- Member Distribution List (Nama Anggota, Simpanan, SHU Jasa Modal, Transaksi, SHU Jasa Usaha, Total SHU)
- Submit button "Kalkulasi & Simpan Pembagian SHU RAT"

- [ ] **Step 3: Test build & verify zero errors**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit Task 3**

```bash
git add src/app/admin/AdminDashboardClient.tsx
git commit -m "feat(shu): add SHU RAT configurator and breakdown UI in Admin Panel"
```

---

### Task 4: Real-time Member Community SHU Display

**Files:**
- Modify: `src/app/community/[id]/page.tsx`
- Modify: `src/app/community/[id]/CommunityDetailClient.tsx` (if present)

**Interfaces:**
- Consumes: `getUserShuSummaryAction` from Task 2
- Produces: Real-time Transparansi SHU & Personal Member SHU Card on Community Dashboard

- [ ] **Step 1: Fetch SHU summary in `src/app/community/[id]`**

Pass SHU data to the community detail component.

- [ ] **Step 2: Render Transparansi SHU Koperasi & Personal SHU Member Card**

Render:
- Summary Card: Total SHU Bersih Koperasi, Alokasi Cadangan, Dana Pendidikan, Dana Sosial, Dana Pengurus.
- Personal Member Statement Card: Total Simpanan Saya, SHU Jasa Modal, Total Transaksi Saya, SHU Jasa Usaha, **Total SHU Diterima**.

- [ ] **Step 3: Run production build verification**

Run: `npm run build`
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit Task 4**

```bash
git add src/app/community/
git commit -m "feat(shu): display real-time SHU distribution on Community Dashboard"
```
