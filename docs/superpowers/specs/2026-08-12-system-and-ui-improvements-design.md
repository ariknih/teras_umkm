# System, UI & UX Improvements Specification for Saloka.id

**Date:** 2026-08-12  
**Target Areas:** Real-time Upload Progress, Premium LMS Player & Completion Tracking, Glassmorphism UI Polish, Admin Quick Reordering

---

## Executive Summary
This design specification outlines 4 core enhancements to elevate Saloka.id's system performance, user experience, and visual aesthetics without AI-generated code bloat ("AI slop").

---

## Key Features & Component Specifications

### 1. Real-time Upload Progress Bar (Admin & Builders)
- **Target Files:** `src/app/admin/AdminDashboardClient.tsx`, `src/app/merchant/builder/[pageId]/page.tsx`
- **Behavior:**
  - Track XMLHttpRequest upload progress when executing direct S3 presigned `PUT` requests.
  - Display live percentage (`0%` to `100%`) and visual progress bar styled with brand green (`#0F5132` / `#2DB24A`).
  - Provide immediate feedback if upload completes or encounters connection drops.

### 2. Premium LMS Video Player & Progress Persistence (Academy)
- **Target Files:** `src/app/academy/course/[id]/page.tsx`, LMS viewer components
- **Behavior:**
  - Replace standard HTML5 controls with a clean, branded video player UI.
  - Automatically save playback progress (`currentTime`) in `localStorage` per user & lesson ID.
  - Auto-resume playback from saved timestamp upon page reload.
  - Auto-mark lesson as completed when playback reaches >= 95% or finishes.

### 3. Glassmorphism & Micro-Interaction Design Polish (Global & Components)
- **Target Files:** `src/app/globals.css`, `src/app/page.tsx`, `src/app/components/Navbar.tsx`
- **Behavior:**
  - Header: Glassmorphic backdrop blur (`backdrop-blur-md bg-white/75 border-b border-slate-200/50`).
  - Shimmer Skeleton Loading components for products, courses, and card grids.
  - Smooth card hover lift (`hover:-translate-y-1 hover:shadow-lg transition-all duration-300`).

### 4. Admin Lesson Quick Reordering (Admin LMS Builder)
- **Target File:** `src/app/admin/AdminDashboardClient.tsx`
- **Behavior:**
  - Add "Move Up" (⬆️) and "Move Down" (⬇️) quick action buttons for lesson order indices.
  - Instantly recalculate indices and trigger `updateLessonAction` without opening the full edit modal.

---

## Verification Plan
1. **TypeScript Build Check:** `npx tsc --noEmit`
2. **Git Commit & Push:** Verify all changes build cleanly and deploy to production environment.
