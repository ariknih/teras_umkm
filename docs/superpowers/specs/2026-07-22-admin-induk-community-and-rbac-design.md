# Design Spec: Admin Induk Community CRUD & Granular Admin RBAC Permissions

**Date**: 2026-07-22  
**Status**: Approved by User  
**Target Files**:
- `prisma/schema.prisma`
- `src/lib/data-store.ts`
- `src/app/actions/admin.ts`
- `src/app/admin/AdminDashboardClient.tsx`
- `src/app/admin/page.tsx`

---

## 1. Overview & Objectives

This specification defines the implementation of two key administrative capabilities in the Teras UMKM Admin Dashboard:

1. **Induk Komunitas Management (CRUD & User Reassignment)**:
   - Super Admin & Authorized Admins can create, view, edit, and delete/suspend Parent Communities ("Induk Komunitas").
   - Super Admin & Authorized Admins can freely reassign any merchant or user to any Induk Komunitas or clear their assigned parent community without restriction.

2. **Granular Admin RBAC Permissions**:
   - Super Admin (`isSuperAdmin = true`) has full unrestricted access to all 12 modules, including Admin & Permission Management.
   - Regular Admins (`isSuperAdmin = false`) are assigned specific module permissions stored as a JSON array (e.g. `["overview", "users", "community"]`).
   - The Admin Dashboard sidebar, page components, and Server Actions strictly enforce these granular permissions.

---

## 2. System Architecture & Data Schema Changes

### 2.1 Database Schema (`prisma/schema.prisma` & `DataStore`)

In the `User` model:
- `adminPermissions`: `String?` — Stores a JSON array string of allowed module tab keys (e.g., `["overview","users","community"]`). Default for existing regular admins is all modules except `admins`.

```prisma
model User {
  // ... existing fields
  isSuperAdmin     Boolean   @default(false)
  adminPermissions String?   // JSON array of allowed module keys for ADMIN role
  indukCommunityId String?
  // ...
}
```

### 2.2 Module Keys (`TabType`)

The 12 permission module keys are:
1. `overview`: Overview & Metrics
2. `users`: User & Merchant Management (including Induk Komunitas Reassignment)
3. `community`: Induk Komunitas CRUD & Member Management
4. `approvals`: Merchant Level & Invoice Approvals
5. `withdrawals`: Withdrawal / Payout Processing
6. `products`: Product Moderation & Management
7. `academy`: Academy Course & Lesson Management
8. `transactions`: Platform Transactions & Financial Logs
9. `coins`: Coin System, Vouchers, & Coin Injection
10. `affiliates`: Affiliate Tree & Commission Monitoring
11. `certificates`: User Certificate Management
12. `admins`: Admin User & Permission Management (Super Admin Exclusive)

---

## 3. Detailed Component & Action Specifications

### 3.1 Server Actions (`src/app/actions/admin.ts`)

1. **Permission Check Helpers**:
   - `ensureAdminPermission(permissionKey: TabType)`: Checks if the logged-in user is an `ADMIN` AND (`isSuperAdmin === true` OR `adminPermissions` includes `permissionKey`). Throws an error if unauthorized.

2. **Induk Komunitas Actions**:
   - `getCommunitiesAdminAction()`: Fetches all communities with chairman & member details.
   - `createCommunityAdminAction(data)`: Creates a new community record in `DataStore` & database.
   - `updateCommunityAdminAction(communityId, data)`: Updates community fields (Name, Type, Category, KetuaId, Legalities, Fees, Status).
   - `deleteCommunityAdminAction(communityId)`: Deletes or suspends a community.
   - `updateUserIndukCommunityAction(userId, communityId)`: Reassigns a user's `indukCommunityId`.

3. **Admin RBAC Management Actions**:
   - `createAdminAction(formData)`: Supports setting `adminPermissions` JSON array when creating a regular admin.
   - `updateAdminPermissionsAction(adminId, permissions: string[], isSuperAdmin: boolean)`: Updates permissions and superadmin status for an admin user.

---

### 3.2 UI Specifications (`src/app/admin/AdminDashboardClient.tsx`)

#### A. Sidebar Dynamic Filtering
- If `currentUser.isSuperAdmin === true`: Shows all 12 navigation items.
- If `currentUser.isSuperAdmin === false`: Parses `currentUser.adminPermissions` (falling back to allowed defaults) and renders only the sidebar navigation items the admin has permission for.

#### B. Tab: "Komunitas Induk" (`activeTab === 'community'`)
- **Header Toolbar**: Search input, Type filter (`PERKUMPULAN`/`KOPERASI`), Category filter (`FREE`/`PAID`/`KOPERASI`), and `+ Tambah Komunitas Induk` button.
- **Community Data Table**: Displays Name, Type, Category, Ketua, Saldo Coin, Iuran/Simpanan, Verified/Suspended status, and Actions (Edit, Members, Delete).
- **Create/Edit Community Modal**:
  - General Info: Name, Type, Category, Ketua User Selector.
  - Legalities: Akta Notaris, AHU, NPWP, Domisili, Kontak PJ.
  - Financials: Join Fee, Monthly Fee, Simpanan Pokok, Simpanan Wajib.
  - Coin Rules: Min Coin Required, Min Coin For Loan.
  - Toggles: Verified, Suspended.
- **Reassign Members Modal**:
  - Lists current members of the selected community.
  - Quick dropdown to reassign or add users to this community.

#### C. Tab: "Users" (`activeTab === 'users'`)
- **Edit User Modal**: Includes an **"Induk Komunitas"** dropdown selector listing all available communities (plus "Tanpa Induk Komunitas").
- Submitting the modal invokes `updateUserIndukCommunityAction` alongside role/level updates.

#### D. Tab: "Kelola Admin" (`activeTab === 'admins'`)
- **Super Admin Exclusive**: Only visible to Super Admin (`isSuperAdmin === true`).
- **Create & Edit Admin Forms**: Contains a checklist matrix of 11 functional modules (excluding `admins`). Super Admin can check/uncheck permissions for each regular admin.

---

## 4. Verification Plan

1. **Unit & Build Check**:
   - Run `npm run build` to verify TypeScript types and Next.js Turbopack compilation.

2. **Functional Verification**:
   - Verify Super Admin can create a new Induk Komunitas and edit its attributes.
   - Verify Super Admin can change a merchant's `indukCommunityId` from the Users tab.
   - Verify creating a regular Admin with custom permissions (e.g. only `users` and `community`) hides unauthorized tabs from their sidebar and blocks access to unauthorized server actions.
