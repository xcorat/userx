# Page Vibe Guide: Value Proposition Page

## Essence and Audience

**Essence:** Grounded, accessible, credible — "free, but profitable" without hype.

**Audience:**
- Early contributors and technically curious investors
- Open-source supporters
- Web3/decentralization advocates
- Developers interested in p2p infrastructure

**Core Message:** UserX aligns user ownership with sustainable value capture. We're building real infrastructure with clear economic models, not making promises.

---

## Color Palette

### Primary Colors
- **Background:** `#f5f2ed` (cream) — Warm, muted base
- **Foreground:** `#2a251f` (dark brown) — High contrast text
- **Surface:** `#ebe6dd` (beige) — Card surfaces and sections

### Accent Colors
- **Primary:** `#7a5a34` (rich brown) — Strong, earthy primary action
- **Accent:** `#4b7a56` (deep moss green) — Trust, growth, technical depth
- **CTA:** `#d98b3d` (terracotta) — Warm, attention-grabbing call-to-action

### Secondary Set (New)
- **Sage:** `#8b9d7f` — For badges and section dividers
- **Slate:** `#6b6d70` — For meta text, captions, timestamps
- **Info:** `#4a5568` (ink/blue-grey) — For "Learn more" links
- **Highlight:** `#e8a96e` (terracotta tint) — Subtle highlights in examples

### Badge & Chip Backgrounds
- **Badge Sage:** `rgba(139, 157, 127, 0.15)` with text `#5a6b4f`
- **Badge Slate:** `rgba(107, 109, 112, 0.12)` with text `#4a4c4f`
- **Badge Info:** `rgba(74, 85, 104, 0.12)` with text `#2d3748`
- **Highlight Light:** `rgba(232, 169, 110, 0.15)` with text `#2a251f`

### Accessibility
All color pairs meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text).

---

## Typography

### Font Families
- **Base:** System font stack (Apple System, Segoe UI, Roboto, etc.)
- **Mono:** SF Mono, Monaco, Cascadia Code, Courier New

### Font Sizes (Fluid Scale)
Use `clamp()` for responsive scaling:
- **Title:** `clamp(2rem, 5vw, 3rem)` — H1, hero titles
- **Subtitle:** `clamp(1rem, 2.5vw, 1.25rem)` — Hero subtitles
- **Body:** `clamp(1rem, 2vw, 1.125rem)` — Main content
- **Small:** `0.875rem` — Meta text, captions, chips

### Font Weights
- **Normal:** 400 — Body text
- **Medium:** 500 — Links, labels
- **Semibold:** 600 — Headings, emphasis
- **Bold:** 700 — Titles only

### Line Height
- **Tight:** 1.25 — Headings
- **Normal:** 1.5 — UI text
- **Relaxed:** 1.625 — Body content
- **Loose:** 1.75 — Long-form reading

### Letter Spacing
- **Tight:** -0.025em — Large headings
- **Normal:** 0 — Body and UI
- **Wide:** 0.025em — Small caps, labels

---

## Components

### ExpandableCard
**Purpose:** Collapsible content sections with summary and detailed views.

**Structure:**
- **Header:** Title + summary (≤2 lines), chevron icon (rotates 180° when expanded)
- **TL;DR box:** Optional, highlighted with left border, terracotta-tint background
- **Body:** Paragraphs, lists, examples
- **Examples:** Italic, left-bordered (accent green), muted text
- **Links:** Chip-style, grouped with "Learn more:" label

**Behavior:**
- Keyboard accessible (Space/Enter to toggle)
- Hover: background change on header, elevation change on card
- Focus: visible ring (accent green)
- Animation: slide transition (respects `prefers-reduced-motion`)

**Visual:**
- White card background
- Subtle border and shadow
- Hover: increased shadow and border emphasis

### StatChip
**Purpose:** Compact metric display (e.g., "Goal: $10k").

**Variants:**
- **Sage:** Progress, status
- **Slate:** Timeline, meta info
- **Info:** Technical details
- **Highlight:** Key metrics, goals

**Structure:**
- Label (lighter) + Value (semibold)
- Padding: 0.5rem / 0.75rem
- Border radius: 8px

### Proof Item
**Purpose:** Show credibility signals (working prototype, technical foundation, community).

**Structure:**
- Icon (48px, accent background, white icon)
- Title (semibold)
- Short description (muted text)

**Layout:** 3-column grid on desktop, single column on mobile.

### FAQ Item
**Purpose:** Collapsible question/answer pairs.

**Structure:**
- `<details>` / `<summary>` for native semantics
- `+` / `−` prefix on question
- Answer indented and muted

**Behavior:**
- Hover: subtle shadow
- Open: shadow persists

---

## Layout

### Mental Model
12-column grid (implicit). Content area constrained to **960px max-width**.

### Vertical Rhythm
Base unit: **4px** (0.25rem). Use multiples of 8px/12px/16px for consistent spacing.

- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 0.75rem (12px)
- **lg:** 1rem (16px)
- **xl:** 1.5rem (24px)
- **2xl:** 2rem (32px)
- **3xl:** 3rem (48px)
- **4xl:** 4rem (64px)

### Breakpoints
- **Mobile:** ≤640px — Single column, stacked layout
- **Tablet:** 641–1023px — Comfortable spacing, still mostly single-column
- **Desktop:** ≥1024px — 2-column card grid, wider spacing

### Safe Areas
On mobile, ensure 44px minimum tap target size for buttons and interactive elements.

---

## Tone and Microcopy

### Writing Principles
- **Simple and direct:** No buzzwords or hype language
- **Grounded:** Examples and proof show depth, not claims
- **Technical honesty:** Acknowledge challenges (e.g., "p2p has buy-in challenges")
- **Action-oriented:** Clear CTAs, avoid passive voice

### Language Guidelines
- **Do use:** "Engagement over attention," "You choose," "Direct utility," "Real economic value"
- **Don't use:** "Moon," "disrupt," "revolutionary," "game-changer" (unless backed by specific proof)

### Examples Style
Prefix with "Example:" or "Use case:" and set in italics with left border. Keep ≤2 sentences.

### Links
- External docs: "Learn more:" label + chip-style links
- Inline links: Underlined, primary brown color
- All external links: `target="_blank" rel="noopener noreferrer"`

---

## Accessibility

### Keyboard Navigation
- **Tab order:** Logical top-to-bottom, left-to-right
- **Focus rings:** 2px solid accent green, 2px offset
- **Interactive elements:** Space/Enter to activate

### Screen Readers
- **ARIA labels:** All buttons have accessible names
- **Semantic HTML:** Headings in order (H1 → H2 → H3), `<nav>`, `<section>`, `<footer>`
- **Details/summary:** Native semantics for FAQ

### Color Contrast
All text meets WCAG AA. Color is never the only indicator (icons, labels, borders also used).

### Motion
Respect `prefers-reduced-motion: reduce`. All transitions set to `duration: 0` when user prefers reduced motion.

---

## Performance

### Assets
- **SVG icons only** (inline or sprite)
- **No images** unless absolutely necessary (and then: lazy-load, WebP with fallback)
- **System fonts** for instant rendering

### Loading
- Preload internal doc links on hover (optional enhancement)
- Inline critical CSS for above-the-fold content

---

## Do / Don't

### Do
✅ Short paragraphs (≤3 sentences)  
✅ Clear headings and structure  
✅ Consistent chip/badge styling  
✅ Specific examples with numbers ("$10k," "3–6 months")  
✅ Show working prototype and links to docs  

### Don't
❌ Long walls of text (break with lists, examples, cards)  
❌ Low-contrast link colors (maintain AA ratios)  
❌ Decorative-only dividers (use semantic sections)  
❌ Vague promises without proof  
❌ Overuse of bold/italics (reserve for true emphasis)  

---

## Component Checklist

When building a new section or component, verify:

- [ ] Color contrast meets AA
- [ ] Focus ring visible on all interactive elements
- [ ] Keyboard accessible (tab, space, enter)
- [ ] Respects `prefers-reduced-motion`
- [ ] Min 44px tap target on mobile
- [ ] Semantic HTML (headings, lists, nav, etc.)
- [ ] Links have clear purpose (not "click here")
- [ ] Consistent spacing using design tokens
- [ ] Tested on mobile, tablet, desktop

---

## References

### Color System
File: `src/lib/styles/skins/startup-earthy.css`

### Components
- `src/lib/components/ui/ExpandableCard.svelte`
- `src/lib/components/ui/StatChip.svelte`

### Page
- `src/routes/about/value/+page.svelte`

### Content Source
- `pub_docs/about/value.md`
- `pub_docs/rustDHT_wiki/` (various technical docs)

---

## Version
**Version:** 1.0  
**Last Updated:** December 2025  
**Maintainer:** UserX Design System
