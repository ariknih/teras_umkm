# Admin Induk Community CRUD & Granular RBAC Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Induk Komunitas CRUD management, free user/merchant parent community reassignment, and granular 12-module RBAC permissions for regular admins in the Teras UMKM Admin Dashboard.

**Architecture:** Extend Prisma `User` schema with `adminPermissions` JSON field; build helper actions in `src/app/actions/admin.ts` enforcing `ensureAdminPermission(tabKey)`; render dynamic sidebar & community management UI in `src/app/admin/AdminDashboardClient.tsx`.

**Tech Stack:** Next.js 16 (App Router, Turbopack, Server Actions), Prisma ORM, React 19, TypeScript.

## Global Constraints
- Keep line endings consistent (CRLF/LF) as configured.
- Preserve existing Next.js 16 APIs and proxy configuration (`src/proxy.ts`).
- Ensure all Server Actions validate permissions server-side before execution.

---

### Task 1: Update Schema & DataStore Methods for Admin Permissions & Community Management

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/data-store.ts`

**Interfaces:**
- Consumes: Prisma Client & DataStore mock memory store
- Produces: `DataStore.updateUserAdminPermissions`, `DataStore.updateUserIndukCommunity`, `DataStore.createCommunityAdmin`, `DataStore.updateCommunityAdmin`, `DataStore.deleteCommunityAdmin`

- [ ] **Step 1: Update Prisma schema with `adminPermissions`**
Add `adminPermissions String?` field to `model User` in `prisma/schema.prisma`.

```prisma
model User {
  // ...
  isSuperAdmin     Boolean   @default(false)
  adminPermissions String?   // JSON array of allowed module keys, e.g., '["overview","users","community"]'
  indukCommunityId String?
  // ...
}
```

- [ ] **Step 2: Add DataStore methods for Community CRUD & Admin Permissions in `src/lib/data-store.ts`**
Add method implementations in `DataStore`:
- `updateUserIndukCommunity(userId: string, communityId: string | null)`
- `updateUserAdminPermissions(userId: string, permissions: string[], isSuperAdmin?: boolean)`
- `createCommunityAdmin(data: any)`
- `updateCommunityAdmin(id: string, data: any)`
- `deleteCommunityAdmin(id: string)`

- [ ] **Step 3: Commit Task 1**

```bash
git add prisma/schema.prisma src/lib/data-store.ts
git commit -m "feat(db): add adminPermissions to User schema and community CRUD DataStore methods"
```

---

### Task 2: Implement Admin Server Actions & Permission Checkers

**Files:**
- Modify: `src/app/actions/admin.ts`

**Interfaces:**
- Consumes: `DataStore` & `getCurrentUser()`
- Produces: Server actions: `updateAdminPermissionsAction`, `getCommunitiesAdminAction`, `createCommunityAdminAction`, `updateCommunityAdminAction`, `deleteCommunityAdminAction`, `updateUserIndukCommunityAction`

- [ ] **Step 1: Add permission helper `ensureAdminPermission` in `src/app/actions/admin.ts`**

```ts
async function ensureAdminPermission(permissionKey: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Hanya untuk Administrator.')
  }
  const dbUser = await DataStore.findUserById(user.id)
  if (!dbUser) throw new Error('Unauthorized.')
  
  if ((dbUser as any).isSuperAdmin) return dbUser
  
  const permissions: string[] = (dbUser as any).adminPermissions
    ? JSON.parse((dbUser as any).adminPermissions)
    : ['overview', 'users', 'community', 'approvals', 'withdrawals', 'products', 'academy', 'transactions', 'coins', 'affiliates', 'certificates']
    
  if (!permissions.includes(permissionKey)) {
    throw new Error(`Unauthorized: Anda tidak memiliki akses ke modul ${permissionKey}.`)
  }
  return dbUser
}
```

- [ ] **Step 2: Implement Server Actions for Admin & Community Management**
Export the following Server Actions in `src/app/actions/admin.ts`:
- `getCommunitiesAdminAction()`
- `createCommunityAdminAction(data: any)`
- `updateCommunityAdminAction(communityId: string, data: any)`
- `deleteCommunityAdminAction(communityId: string)`
- `updateUserIndukCommunityAction(userId: string, communityId: string | null)`
- `updateAdminPermissionsAction(adminId: string, permissions: string[], isSuperAdmin: boolean)`

- [ ] **Step 3: Commit Task 2**

```bash
git add src/app/actions/admin.ts
git commit -m "feat(actions): add admin RBAC permission guard and community management server actions"
```

---

### Task 3: Build Admin Dashboard UI for Induk Komunitas CRUD & RBAC Matrix

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: Server actions from `src/app/actions/admin.ts` and `currentUser` props.
- Produces: Rendered Admin Dashboard tabs for Induk Komunitas, RBAC checklist matrix in Admin Management, and Induk Komunitas reassign selector in User Edit Modal.

- [ ] **Step 1: Pass initial communities data in `src/app/admin/page.tsx`**
In `src/app/admin/page.tsx`, fetch `initialCommunities` via `DataStore.getCommunities()` and pass to `AdminDashboardClient`.

- [ ] **Step 2: Add Sidebar permission filtering in `AdminDashboardClient.tsx`**
Filter sidebar menu items based on `currentUser.isSuperAdmin` or `currentUser.adminPermissions`.

- [ ] **Step 3: Render Tab "Komunitas Induk" (`activeTab === 'community'`)**
Render search/filter controls, "+ Tambah Komunitas Induk" button, Communities Data Table, and Create/Edit/Reassign Modals.

- [ ] **Step 4: Add "Induk Komunitas" dropdown selector to User Edit Modal**
In the Edit User Modal (under `activeTab === 'users'`), add a select dropdown for `indukCommunityId` listing all available communities plus "Tanpa Induk Komunitas".

- [ ] **Step 5: Add Permission Checklist Matrix to Admin Create/Edit Modal**
In the Admin Management Modal (`activeTab === 'admins'`), display checkboxes for the 11 functional module permissions when creating or editing regular admins.

- [ ] **Step 6: Run build verification**

```bash
npm run build
```

- [ ] **Step 7: Commit Task 3**

```bash
git add src/app/admin/page.tsx src/app/admin/AdminDashboardClient.tsx
git commit -m "feat(admin): implement Induk Komunitas CRUD UI, user reassignment, and RBAC permissions matrix"
```
