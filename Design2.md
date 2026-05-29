# Design System: De Stijl Abstrato

## 1. Definição do Estilo

- **Nome:** De Stijl Abstrato
- **Tipo:** Geometric, Minimalist, Structured
- **Keywords:** de stijl, abstract, geometric, minimalist, structured, primary colors, grid, bold lines, asymmetrical, neoplasticism
- **Era:** Early 20th Century, Neoplasticism
- **Light/Dark:** ✓ Full / ✗ No

## 2. Paleta de Cores

- **Primárias:** Primary Red #FF0000, Primary Blue #0000FF, Primary Yellow #FFFF00, Black #000000
- **Secundárias:** White #FFFFFF, Grey #808080

## 3. Efeitos Visuais

Strong grid layout, bold black lines, blocks of primary colors, asymmetrical balance, minimalist typography, focus on composition, no decorative elements, sharp corners

## 4. AI Prompt Keywords

Design a De Stijl abstract landing page. Use: primary red, blue, and yellow, strong grid layout, bold black lines, blocks of primary colors, asymmetrical balance, minimalist typography, sharp corners, no decorative elements.

## 5. CSS Technical

```css
background: #FFFFFF, display: grid, grid-template-columns: repeat(12, 1fr), grid-gap: 10px, font-family: 'Helvetica', sans-serif, border: 2px solid #000000, .red-block { background-color: #FF0000; }, .blue-block { background-color: #0000FF; }, .yellow-block { background-color: #FFFF00; }
```

## 6. Design System Variables

```css
--primary-red-destijl: #FF0000, --primary-blue-destijl: #0000FF, --primary-yellow-destijl: #FFFF00, --black-destijl: #000000, --grid-gap-destijl: 10px, --font-destijl: 'Helvetica', sans-serif
```

## 7. Checklist de Implementação

- ☐ Strong grid layout
- ☐ Bold black lines
- ☐ Blocks of primary colors
- ☐ Asymmetrical balance
- ☐ Minimalist typography
- ☐ Sharp corners

## 8. Visual Theme & Atmosphere

De Stijl Abstrato — Design general com de stijl, abstract, geometric. Template e prompt pronto para IA. Estilo De Stijl Abstrato representa uma tendência moderna em design UI/UX web com foco em general.

- Density: 3/10 — Airy
- Variance: 7/10 — Dynamic
- Motion: 4/10 — Subtle

## 9. Color Palette & Roles

- **Primary Red** (#FF0000) — Primary accent, CTAs and interactive elements
- **Primary Blue** (#0000FF) — Primary accent, CTAs and interactive elements
- **Primary Yellow** (#FFFF00) — Primary accent, CTAs and interactive elements
- **Black** (#000000) — Dark surface, primary background
- **White** (#FFFFFF) — Secondary surface
- **Grey** (#808080) — Secondary text, borders, muted elements

## 10. Typography Rules

- **Display / Hero:** Helvetica — Weight 700, tight tracking, used for headline impact
- **Body:** Helvetica — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Helvetica — 0.875rem, weight 500, slight letter-spacing
- **Monospace:** JetBrains Mono — Used for code, metadata, and technical values

Scale:

- Hero: clamp(2.5rem, 5vw, 4rem)
- H1: 2.25rem
- H2: 1.5rem
- Body: 1rem / 1.6
- Small: 0.875rem

## 11. Component Stylings

- **Primary Button:** Subtly rounded (0.5rem) shape. Accent color fill. Hover: 8% darken + subtle lift shadow. Active: -1px translate tactile press. Font weight 600. No outer glows.
- **Secondary / Ghost Button:** Outline variant. 1.5px border in muted color. Text in primary color. Hover: subtle background fill.
- **Cards:** Subtly rounded (0.5rem) corners. Surface background. Subtle shadow (0 2px 12px rgba(0,0,0,0.06)). 1px border stroke.
- **Inputs:** Label above input. 1px border stroke. Focus ring: 2px accent color offset 2px. Error text below in semantic red. No floating labels.
- **Navigation:** Primary surface background. Active item: accent color indicator. Font weight 500 when active.
- **Skeletons:** Shimmer animation matching component dimensions. No circular spinners.
- **Empty States:** Icon-based composition with descriptive text and action button.

## 12. Layout Principles

- **Grid:** CSS Grid primary. Max-width containment: 1280px centered with 1.5rem side padding.
- **Spacing rhythm:** Balanced. Base unit: 0.5rem (8px).
- **Section vertical gaps:** clamp(4rem, 8vw, 8rem).
- **Hero layout:** Asymmetric composition.
- **Feature sections:** Asymmetric grid with varied card sizes. No 3-equal-columns.
- **Mobile collapse:** All multi-column layouts collapse below 768px. No horizontal overflow.
- **z-index contract:** base (0) / sticky-nav (100) / overlay (200) / modal (300) / toast (500).

## 13. Motion & Interaction

- **Physics:** Ease-out curves, 200-300ms duration. Smooth and predictable.
- **Entry animations:** Fade + translate-Y (16px → 0) over 420ms ease-out. Staggered cascades for lists: 80ms between items.
- **Hover states:** Subtle color shift + shadow adjustment over 200ms.
- **Page transitions:** Fade only (200ms).
- **Performance:** Only transform and opacity animated. No layout-triggering properties.

## 14. Anti-Patterns (Banned)

- No emojis in UI — use icon system only (Lucide, Heroicons)
- No decorative gradients — flat color only
- No shadows heavier than 0 2px 8px rgba(0,0,0,0.08)
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

## Contexto Histórico

Estilo De Stijl Abstrato representa uma tendência moderna em design UI/UX web com foco em general.

## Caso de Uso

Landing pages, SaaS
