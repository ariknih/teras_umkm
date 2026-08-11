# System, UI & UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time upload progress percentage, sleek custom LMS video player with completion tracking, glassmorphism UI & shimmer loading states, and quick admin lesson reordering.

**Architecture:** Enhance client components (`AdminDashboardClient.tsx`, `AcademyViewer.tsx` / `course/[id]/page.tsx`, `globals.css`) with modular handlers for S3 XMLHttpRequest upload progress, custom HTML5 video controls, CSS glassmorphism, and instant Server Action order re-indexing.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript 5, AWS S3 Client SDK.

## Global Constraints
- Preserve all existing API contracts and design tokens.
- No AI slop / generic bloated code — keep components concise, accessible, and high-performance.

---

### Task 1: Real-time S3 Upload Progress Bar & Mb/s Indicator

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx:2195-2270`
- Modify: `src/app/merchant/builder/[pageId]/page.tsx:608-640`

**Interfaces:**
- Consumes: `/api/upload/presigned` JSON endpoint
- Produces: `uploadProgress` state (number 0-100) and `uploadSpeed` (string) for visual upload status feedback.

- [ ] **Step 1: Implement XMLHttpRequest Presigned PUT helper with progress listener**
  In `AdminDashboardClient.tsx`: Replace `fetch(presignedData.uploadUrl, { method: 'PUT', body: file })` with an XHR wrapper that listens to `xhr.upload.onprogress`.

- [ ] **Step 2: Add visual progress bar component below file input**
  Render an emerald animated progress bar with `width: ${uploadProgress}%` and live speed (`${speed} MB/s`).

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Exit 0

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/admin/AdminDashboardClient.tsx src/app/merchant/builder/[pageId]/page.tsx
  git commit -m "feat(upload): add real-time percentage progress bar for S3 uploads"
  ```

---

### Task 2: Admin Quick Lesson Reordering (Up / Down)

**Files:**
- Modify: `src/app/admin/AdminDashboardClient.tsx:1920-1990`

**Interfaces:**
- Consumes: `updateLessonAction` from `@/app/actions/admin`
- Produces: Quick shift handlers for `orderIndex` up and down without opening modals.

- [ ] **Step 1: Add Move Up (⬆️) and Move Down (⬇️) action buttons to lesson list items**
  In `AdminDashboardClient.tsx`: In the lesson list rendering block, add action buttons that trigger `handleShiftLessonOrder(lesson, direction)`.

- [ ] **Step 2: Implement `handleShiftLessonOrder` server action call**
  Swap `orderIndex` between neighboring lessons and invoke `updateLessonAction`.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Exit 0

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/admin/AdminDashboardClient.tsx
  git commit -m "feat(admin): add quick lesson reordering up/down buttons"
  ```

---

### Task 3: Glassmorphism Navbar & Micro-Interaction Shimmer Loading States

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/components/Navbar.tsx` (or Header component)
- Create: `src/app/components/SkeletonCard.tsx`

**Interfaces:**
- Consumes: Tailwind utility classes & CSS variables
- Produces: Reusable `<SkeletonCard />` and `.glass-header` styles.

- [ ] **Step 1: Add glassmorphic backdrop CSS utilities in `globals.css`**
  Define `.glass-header` with `backdrop-filter: blur(12px)` and subtle border.

- [ ] **Step 2: Create `<SkeletonCard />` loading component**
  Build a clean Tailwind shimmer animation card for products and course lists.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `npx tsc --noEmit`
  Expected: Exit 0

- [ ] **Step 4: Commit**
  ```bash
  git add src/app/globals.css src/app/components/
  git commit -m "style(ui): add glassmorphism header & shimmer loading skeletons"
  ```
