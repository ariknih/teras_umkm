# Community Landing Page Template and Customization Spec

This document details the implementation of a customizable community landing page template. The design will directly replicate the provided layout (e.g., Kopjaswara) and support editing landing page content (photos, copy, statistics, advantages, activities) by community administrators from the Settings dashboard.

## 1. Requirements & Core Goals
* **Public Landing Page**: A fully responsive, visually stunning landing page for each community based on the provided mockup layout.
* **Access Control & Routing**: 
  * All visitors (members & non-members) default to the Landing Page when opening `/community/[id]`.
  * Members and admins can transition from the Landing Page into the internal Dashboard via a prominent "Lihat Komunitas" CTA.
  * Non-members see a public version of the Dashboard (with tab limitations) if they choose to view the community.
* **Editable Sections**: Admins/Ketua can customize:
  * Hero Section (Badge, Title, Subtitle, Description, Cover Image, Quote Text/Author, Metadata didirikan/ketua/lokasi/anggota).
  * Keuntungan Menjadi Anggota (5 benefit cards: title, description, icon).
  * Statistik Kunci (4 metric cards: value, label, description, icon).
  * Kegiatan Terbaru (3 activity cards: title, category, date/location, cover image).
  * CTA Banner (Promotional text, CTA button text).
* **Zero AI Slop**: Use clean CSS layouts, modern SVG or Lucide icons, and high-quality photography from Unsplash as fallbacks. No generic AI-generated graphics or illustrations.
* **Persistence**: Save landing page configurations as a JSON string within the `landingPageConfig` field of the `Community` database model.

---

## 2. Technical Design & Architecture

### Database Persistence & Type Definitions
The data will be stored as a JSON string inside the `landingPageConfig` column of the `Community` model. We define the configuration structure in TypeScript:

```typescript
export interface LandingPageConfig {
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    description: string;
    coverUrl: string;
    quoteText: string;
    quoteAuthor: string;
    didirikan: string;
    ketua: string;
    lokasi: string;
    anggotaCount: string;
  };
  benefits: Array<{
    title: string;
    description: string;
    icon: string; // Lucide icon name
  }>;
  stats: Array<{
    value: string;
    label: string;
    desc: string;
    icon: string; // Lucide icon name
  }>;
  activities: Array<{
    title: string;
    category: string;
    dateLocation: string;
    imageUrl: string;
  }>;
  ctaBanner: {
    text: string;
    buttonText: string;
  };
}
```

### Navigational Routing Flow
A state variable `viewMode` (either `'landing'` or `'dashboard'`) will control the screen rendering in `src/app/community/[id]/page.tsx`:
```typescript
const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing')
```
* On initial page load of `/community/[id]`, `viewMode` defaults to `'landing'`.
* Clicking **"Lihat Komunitas"** transitions `viewMode` to `'dashboard'`.
* If a logged-in user is a member/admin, the dashboard offers full access. If they are a visitor, they see the locked public preview.
* In the dashboard, a button or sidebar option **"Lihat Landing Page"** allows members/admins to return to the landing page.

---

## 3. UI Component Specs

### Section A: Header / Navbar
* Dynamic representation of Saloka.id header.
* Buttons for "Masuk" and "Daftar" if not logged in.
* Logo branding on the top left.

### Section B: Hero Section
* **Left Content**: Badges and text layouts with typography matching the mockup (Sora/Sans, clean font-weights).
* **CTAs**: Green action button "Menjadi Anggota" (initiates membership check & join modal) and "Lihat Komunitas" (switches state to dashboard).
* **Right Content**: A highly polished overlapping collage with:
  * A main rounded image (fallback: cafe collaborative session photo).
  * A quote card overlay on the bottom-right of the image with a large quote icon, text, and author signature.
* **Metadata Bar**: Horizontally aligned icons showing didirikan date, Ketua name, Lokasi, and Anggota counts.

### Section C: Benefits Section ("Keuntungan Menjadi Anggota")
* Horizontal grid containing 5 cards with circular green icon backgrounds, title, and descriptive text.

### Section D: Statistics Row
* A wide light gray card with 4 column metrics:
  * Active icon, large value (e.g. "Rp 1,2 M+"), label, and description.

### Section E: Recent Activities ("Kegiatan Terbaru")
* Section title header with a "Lihat Semua" link.
* Grid of 3 cards containing:
  * Top image (Unsplash seminar/business photography).
  * Category badge (e.g. WEBINAR, PELATIHAN).
  * Clean bold titles and date/location metadata.

### Section F: Bottom CTA & Footer
* High-contrast dark green banner with call-to-action button.
* Structured footer with Saloka.id branding and quick links.

---

## 4. Settings Form (Dashboard Editor UI)
Inside the `Pengaturan` tab, we will implement a configuration form divided into expandable sub-sections:
1. **Hero & Metadata**: Edit title, slogan, description, didirikan, ketua, lokasi, cover image URL, and quote details.
2. **Keuntungan (5 Items)**: Form fields to edit titles and descriptions for the benefits.
3. **Statistik (4 Items)**: Form fields to edit value numbers, labels, and description texts.
4. **Kegiatan Terbaru (3 Items)**: Form fields to edit cover image, category badge, title, and dates.
5. **CTA Banner**: Edit bottom banner text and button labels.

Each image input will support file selection and uploads via `/api/upload` automatically.

---

## 5. Verification Plan

### Automated Build Verification
* Run `npm run build` to ensure typescript compilation passes without issues.

### Manual Verification
* Access `/community/comm-dummy-2` and check that the public landing page loads.
* Click "Lihat Komunitas" to confirm it opens the dashboard.
* For community leaders, open "Pengaturan" and modify landing page fields. Save the form and verify changes persist instantly.
* Ensure all assets are loaded from high-quality Unsplash URLs (no AI illustrations).
