# Design System: Estilo de Computação de Alta Performance

## 1. Definição do Estilo

- **Nome:** Estilo de Computação de Alta Performance
- **Tipo:** Powerful, Technical, Modern
- **Keywords:** processors, GPUs, data center, high performance, technical, modern, efficient, scalable, reliable, cutting-edge
- **Era:** 2026+ HPC Dominance
- **Light/Dark:** ✗ No / ✓ Full

## 2. Paleta de Cores

- **Primárias:** Vermelho Performance #ED1C24, Preto #000000, Branco #FFFFFF, Cinza Escuro #333333
- **Secundárias:** Prata #C0C0C0, Azul Elétrico #00BFFF, Verde #00FF00, Cinza Claro #CCCCCC

## 3. Efeitos Visuais

Visualizações de desempenho de chips, diagramas de arquitetura de processadores, brilhos sutis em elementos de alta performance, tipografia técnica e ousada, micro-interações de dados em tempo real, elementos modulares, animações de fluxo de dados e calor.

## 4. AI Prompt Keywords

Design a powerful and technical landing page for new server processors. Use: performance red accents, black background, chip performance visualizations, processor architecture diagrams, subtle high-performance glows, bold technical typography, real-time data micro-interactions, modular elements, data and heat flow animations, cutting-edge and efficient feel.

## 5. CSS Technical

```css
background: #000000, color: #FFFFFF, text-shadow: 0 0 8px rgba(237,28,36,0.5), box-shadow: inset 0 0 15px rgba(0,0,0,0.7), border-left: 3px solid #ED1C24, font-family: "Roboto, sans-serif", animation: chip-glow 5s linear infinite alternate, perspective: 1200px, transform-style: preserve-3d.
```

## 6. Design System Variables

```css
--performance-red: #ED1C24, --black: #000000, --white: #FFFFFF, --dark-grey: #333333, --glow-intensity: 0.5, --border-accent: 3px solid #ED1C24, --font-tech: "Roboto, sans-serif".
```

## 7. Checklist de Implementação

- ☐ Visualizações de desempenho
- ☐ Diagramas de arquitetura
- ☐ Brilhos de alta performance
- ☐ Tipografia técnica
- ☐ Micro-interações de dados
- ☐ Animações de fluxo de calor.

## 8. Visual Theme & Atmosphere

Estilo de Computação de Alta Performance — Design tech-inspired com processors, gpus, data center. Template e prompt pronto para IA. Estilo Estilo de Computação de Alta Performance representa uma tendência moderna em design UI/UX web com foco em tech-inspired.

- Density: 7/10 — Compact
- Variance: 4/10 — Moderate
- Motion: 4/10 — Subtle

## 9. Color Palette & Roles

- **Vermelho Performance** (#ED1C24) — Error states, destructive actions
- **Preto** (#000000) — Dark surface, primary background
- **Branco** (#FFFFFF) — Light surface, card backgrounds
- **Cinza Escuro** (#333333) — Dark surface, primary background
- **Prata** (#C0C0C0) — Extended palette, decorative use
- **Azul Elétrico** (#00BFFF) — Secondary accent
- **Verde** (#00FF00) — Success states, positive indicators
- **Cinza Claro** (#CCCCCC) — Secondary text, borders, muted elements

## 10. Typography Rules

- **Display / Hero:** Roboto — Weight 700, tight tracking, used for headline impact
- **Body:** Roboto — Weight 400, 16px/1.6 line-height, max 72ch per line
- **UI Labels / Captions:** Roboto — 0.875rem, weight 500, slight letter-spacing
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
- **Hero layout:** Split-screen (text left, visual right).
- **Feature sections:** Zig-zag alternating text+image rows. No 3-equal-columns.
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
- No pure black (#000000) — use off-black or charcoal variants
- No oversaturated accent colors (saturation cap: 80%)
- No 3-column equal-width feature layouts — use zig-zag or asymmetric grid
- No `h-screen` — use `min-h-[100dvh]`
- No AI copywriting clichés: "Elevate", "Seamless", "Unleash", "Next-Gen"
- No broken external image links — use picsum.photos or inline SVG
- No generic lorem ipsum in demos

## Contexto Histórico

Estilo Estilo de Computação de Alta Performance representa uma tendência moderna em design UI/UX web com foco em tech-inspired.

## Caso de Uso

Landing pages, Websites modernas
