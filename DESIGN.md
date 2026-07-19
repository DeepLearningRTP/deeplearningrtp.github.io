---
name: Deep Learning RTP
description: The web front door for a free weekly neural-network study group in Research Triangle Park.
colors:
  cream-bg: "#f7f4ec"
  warm-panel: "#fffdf8"
  ink: "#1b1b1a"
  muted-olive: "#6b6a63"
  hairline: "#e4dfd2"
  spruce-teal: "#0f5f57"
  teal-ink: "#0a4b44"
  biblio-paper: "#fcfcfa"
  biblio-ink: "#1c1c1a"
  quiet-gray: "#6d6d66"
  biblio-rule: "#d9d9d2"
  citation-navy: "#234e70"
  navy-wash: "#eef2f6"
typography:
  display:
    fontFamily: "ui-serif, Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"
    fontSize: "clamp(38px, 7vw, 60px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-serif, Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"
    fontSize: "clamp(26px, 4vw, 34px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.7
  biblio-body:
    fontFamily: "Charter, 'Bitstream Charter', Cambria, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  sm: "18px"
  md: "24px"
  lg: "64px"
  xl: "80px"
components:
  button-primary:
    backgroundColor: "{colors.spruce-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.teal-ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.teal-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  card:
    backgroundColor: "{colors.warm-panel}"
    rounded: "{rounded.lg}"
    padding: "22px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "5px"
    padding: "11px 13px"
---

# Design System: Deep Learning RTP

## 1. Overview

**Creative North Star: "The Seminar Table"**

Everyone around one table with the paper in the middle. The system is warm, plain, and serious: paper-toned backgrounds, ink text, hairline rules doing the structural work, and a single accent spent where attention belongs. It reads like a well-kept study group, not a startup — rigorous, welcoming, unpretentious, in that order.

The site carries **two deliberate registers**. The **Front Door** (home, speaker page) is warm cream with a spruce-teal accent: serif headings over a quiet system sans, monospace eyebrows, room to breathe. The **Bibliography** (events pages) is cooler ink-on-paper with a citation-navy accent: Charter serif body, mono labels, list discipline. They are siblings, not drift within a register — but never mix their accents on one page. A third register, **The Annals** (`history/index.html`), is a sealed historical document: oxblood-on-paper Georgia, frozen as generated in June 2026. It takes no new design work, and its period features (stat tiles, side-stripe cards, Verdana labels) are grandfathered as part of the artifact.

The system explicitly rejects the hype-y crypto/AI landing page (big claims, countdown urgency, "join the revolution") and the neon "AI aesthetic" (dark-mode gradients, glow). Nothing here manufactures excitement; the track record does the persuading.

**Key Characteristics:**
- Paper tones + ink text; one accent per register, spent deliberately
- Hairline 1px rules carry all structure; zero shadows
- Serif display over sans (Front Door) or Charter serif throughout (Bibliography)
- Monospace reserved for metadata: eyebrows, dates, tags
- Quiet and bookish interaction — flat surfaces, small radii, whispered hovers

## 2. Colors

Two sibling paper-and-ink palettes, each with exactly one accent.

### Primary
- **Spruce Teal** (#0f5f57): the Front Door's single accent — eyebrows, event dates, primary buttons, link hovers, focus rings. Its darker partner **Teal Ink** (#0a4b44) handles resting link text and button hover.
- **Citation Navy** (#234e70): the Bibliography's single accent — links, citation-card labels and left rules, button outlines. **Navy Wash** (#eef2f6) is its only tint, used as the featured-citation background.

### Neutral
- **Cream Bg** (#f7f4ec) / **Biblio Paper** (#fcfcfa): page backgrounds per register.
- **Warm Panel** (#fffdf8): raised-but-flat card surface on cream; pure #fff for form fields.
- **Ink** (#1b1b1a) / **Biblio Ink** (#1c1c1a): all reading text.
- **Muted Olive** (#6b6a63) / **Quiet Gray** (#6d6d66): secondary text, ledes, asides.
- **Hairline** (#e4dfd2) / **Biblio Rule** (#d9d9d2): every border, rule, and divider.

### Named Rules
**The One Lamp Rule.** Each register owns exactly one accent and spends it like lamplight: metadata, dates, actions, focus. A second accent hue on the same page is forbidden; teal never appears on Bibliography pages, navy never on the Front Door.

**The Two Registers Rule.** Front Door (cream + teal) and Bibliography (paper + navy) are deliberate sibling identities. Keep each internally consistent; don't average them into one lukewarm palette. The Annals (oxblood `#8a3318` on paper) is a sealed third register: never restyle it, never borrow its palette for live pages.

## 3. Typography

**Display Font:** ui-serif stack (Georgia / Iowan Old Style / Palatino fallbacks)
**Body Font:** system sans (Front Door); Charter serif (Bibliography)
**Label/Mono Font:** ui-monospace stack (SF Mono / Menlo / Consolas); Berkeley Mono where installed

**Character:** Bookish contrast — serif headings that read like chapter openers over an unfussy sans body; on events pages, Charter carries everything like a well-set preprint. Mono appears only as metadata, never as voice.

### Hierarchy
- **Display** (600, clamp(38px, 7vw, 60px), 1.08, -0.02em): hero headline only.
- **Headline** (600, clamp(26px, 4vw, 34px), 1.2, -0.01em): section headings.
- **Body** (400, 17px, 1.7 sans / 1.55 Charter): reading text; ledes and asides in the muted neutral. Prose capped at ~60–66ch (`--col: 760px`).
- **Label** (600, 12px, 0.18em tracking, uppercase, mono): section eyebrows, card tags (11px), event dates (13px).

### Named Rules
**The Metadata Mono Rule.** Monospace marks machine-adjacent facts — dates, tags, eyebrows, model sizes — and nothing else. Body copy in mono is costume.

## 4. Elevation

Entirely flat. Depth is conveyed by hairline 1px borders and one-step surface tints (Warm Panel on Cream, Navy Wash on Paper), never by shadows — there is not a single `box-shadow` in the system. The lone atmospheric effect is the sticky header's `backdrop-filter: blur(6px)` over a translucent cream, which reads as paper sliding under glass, not as elevation.

### Named Rules
**The Hairline Rule.** If two areas need separating, draw a 1px rule in the register's line color. If a surface needs lifting, tint it one step. Shadows are prohibited.

## 5. Components

Quiet and bookish: flat, hairline-bordered, small radii; interaction whispers.

### Buttons
- **Shape:** gently squared (4px radius; 3px on Bibliography pages)
- **Primary:** solid Spruce Teal, white text, 12px 22px padding, 600 weight
- **Hover / Focus:** darkens to Teal Ink; inputs and links get a 2px accent outline; no motion
- **Ghost:** transparent with hairline border, Teal Ink text; border warms to accent on hover. Bibliography buttons are outline-only navy, filling solid on hover.

### Cards / Containers
- **Corner Style:** 6–10px by weight (facts panel 6px, demo cards 8px, events cards 10px)
- **Background:** Warm Panel on cream; transparent or Navy Wash on paper
- **Shadow Strategy:** none — hairline border only (The Hairline Rule)
- **Internal Padding:** ~22px

### Inputs / Fields
- **Style:** pure white field, hairline border, 5px radius, body-size text
- **Focus:** 2px Spruce Teal outline, zero offset

### Navigation
- **Style:** sticky translucent cream bar with blur, hairline bottom rule; serif wordmark at 18px; muted sans links (14px) that darken to ink on hover; nav hidden under 640px. Bibliography header is a static baseline-aligned row with a tracked wordmark.

### Citation Card (signature)
The Bibliography's featured-event affordance: Navy Wash background, 3px navy left rule, uppercase mono cite-label, 0/4px asymmetric radii — deliberately shaped like a highlighted bibliography entry. Archive entries reuse the shape, transparent with the rule graying out until hover. This is a committed brand mark, not a generic callout style; don't imitate it on Front Door pages.

### Event Row (signature)
Baseline-aligned flex row: mono accent date (fixed 74px column) + plain title, separated by hairline rules. The whole "what's next" section is these rows and nothing else.

## 6. Do's and Don'ts

### Do:
- **Do** spend the register's single accent on metadata, dates, and actions only (The One Lamp Rule); everything else is ink and paper.
- **Do** structure with 1px hairlines (#e4dfd2 / #d9d9d2) and one-step surface tints; keep every surface flat.
- **Do** keep mono for metadata (dates, tags, eyebrows) at small sizes with wide tracking.
- **Do** keep the existing `prefers-reduced-motion` kill-switch on any motion you add.
- **Do** let proof carry the page: real meeting rows, the archive, working demos — per PRODUCT.md, "claims never outrun evidence."

### Don't:
- **Don't** build anything resembling the "hype-y crypto/AI landing: big claims, countdown urgency, 'join the revolution' copy" (PRODUCT.md's anti-reference, verbatim).
- **Don't** use the neon "AI aesthetic": dark-mode gradients, glowing purple, glassmorphism-as-decoration, sci-fi chrome.
- **Don't** add box-shadows, a second accent hue per page, or cross-pollinate teal onto Bibliography pages (or navy onto the Front Door).
- **Don't** use gradient text, side-stripe accents on new components (the Citation Card is the one grandfathered, signature exception), or icon-topped identical card grids.
- **Don't** exceed the ~760px prose column; this is a reading site, not a dashboard.
