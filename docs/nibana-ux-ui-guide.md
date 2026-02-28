# Nibana UX/UI Comprehensive Improvement Guide

> A living reference for making nibana.life more impactful, user-friendly, and attention-grabbing.
> Built on top of the existing Shopify Horizon theme (v2.0.1) design system.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Hero / Above-the-Fold](#2-hero--above-the-fold)
3. [Navigation & Header](#3-navigation--header)
4. [Color & Visual Identity](#4-color--visual-identity)
5. [Typography](#5-typography)
6. [Homepage Section-by-Section](#6-homepage-section-by-section)
7. [Coaching Service Pages](#7-coaching-service-pages)
8. [About Page](#8-about-page)
9. [Blog](#9-blog)
10. [Contact & Booking Pages](#10-contact--booking-pages)
11. [CTA Strategy](#11-cta-strategy)
12. [Mobile UX](#12-mobile-ux)
13. [Micro-interactions & Animation](#13-micro-interactions--animation)
14. [Social Proof & Trust](#14-social-proof--trust)
15. [Accessibility](#15-accessibility)
16. [Performance](#16-performance)
17. [Implementation Priority Matrix](#17-implementation-priority-matrix)

---

## 1. Executive Summary

### Top 5 Quick Wins (under 1 hour each)

| # | Change | Impact | File(s) |
|---|--------|--------|---------|
| 1 | Add CTA pulse animation to draw the eye to "Book a call" | High | `assets/base.css` |
| 2 | Increase hero overlay opacity for better text contrast | High | Shopify Theme Editor → Hero section settings |
| 3 | Add reassurance microcopy below all primary CTAs | Medium | `sections/home-get-in-touch.liquid`, `sections/cta-bar.liquid` |
| 4 | Add alternating section backgrounds on homepage | Medium | `assets/base.css` |
| 5 | Fix duplicate `.nb-cta` definitions causing specificity conflicts | Low | `assets/base.css` (lines ~5212 and ~5268) |

### Top 5 High-Impact Changes (require more effort)

| # | Change | Impact | Effort |
|---|--------|--------|--------|
| 1 | Animated hero entrance with scroll-triggered stats counter | High | Medium |
| 2 | Service card hover overlays with descriptions | High | Medium |
| 3 | Video testimonial section | High | Heavy |
| 4 | Mega-menu for coaching services with previews | Medium | Heavy |
| 5 | Enhance existing mobile floating CTA with microcopy/animation | Medium | Quick |

### Key Metrics to Track

- **Bounce rate** on homepage (target: < 40%)
- **Time on page** for coaching service pages (target: > 2 min)
- **CTA click-through rate** on "Book a free 20-min call" (target: > 5%)
- **Mobile conversion rate** vs desktop (target: parity)
- **Scroll depth** on homepage (target: > 75% reach the CTA)

---

## 2. Hero / Above-the-Fold

**Current state:** The hero section (`sections/hero.liquid`) uses a full-width background image with text overlaid. The overlay is configured via `toggle_overlay` and `overlay_color` settings (default: `#00000026` — very light). Text may lack contrast against the photo, and the entrance is static.

### 2.1 Strengthen Text Contrast

**Problem:** The default overlay color (`#00000026`) is only 15% opacity black — too subtle for reliable text legibility over photographic backgrounds.

**Recommendation:** Use a gradient overlay (bottom-heavy) to protect the text area while keeping the top of the image visible.

**Implementation — via Theme Editor:**
- Hero section → Media overlay → Enable
- Overlay style → Gradient
- Overlay color → `#000000` at 55–65% alpha (`#00000099`)
- Gradient direction → "Up" (darker at bottom where text lives)

**Implementation — via CSS fallback** (add to `assets/base.css`):

```css
/* Ensure hero text is always legible over photos */
.hero__media-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.20) 40%,
    transparent 70%
  );
  z-index: 1;
  pointer-events: none;
}
```

**File:** `assets/base.css`
**Impact:** High — prevents unreadable text, especially on mobile where image crops differently.

### 2.2 Animated Text Entrance

**Problem:** The hero content appears instantly — no sense of arrival or gravitas.

**Recommendation:** Add a staggered fade-up entrance using the existing `[data-anim]` pattern from `nb-visuals.css`.

```css
/* Hero entrance animation */
@media (prefers-reduced-motion: no-preference) {
  .hero__content-wrapper [class*="group-block"] {
    opacity: 0;
    transform: translateY(20px);
    animation: nb-hero-enter 0.8s ease forwards;
  }

  .hero__content-wrapper [class*="group-block"]:nth-child(1) { animation-delay: 0.1s; }
  .hero__content-wrapper [class*="group-block"]:nth-child(2) { animation-delay: 0.3s; }
  .hero__content-wrapper [class*="group-block"]:nth-child(3) { animation-delay: 0.5s; }

  @keyframes nb-hero-enter {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

**File:** `assets/base.css`
**Impact:** Medium — creates a premium "reveal" moment that signals quality.

### 2.3 Enhance the Existing Social Proof Logo Bar Below Hero

**Current state:** The homepage already has a social proof logo bar (`section_yYHbaA` in `templates/index.json`) placed directly below the hero. It uses the "Icons with text" section type and displays five media/event logos: **GQ**, **TEDx Lambeth**, **Ministry of Justice**, **Thrive Global**, and **The Good Men Project**. This is a strong credibility signal in an excellent position.

**Recommendations to enhance it:**

1. **Add a heading** — Add a subtle "As Featured In" or "Trusted By" label above the logos so visitors instantly understand what they're looking at.

2. **Add a stats row beneath** — Complement the existing logo bar with a compact stats strip showing key credibility numbers (e.g., "7+ Years coaching", "100+ Clients", "15+ Countries"). This pairs social proof (logos) with quantitative proof (numbers) for a 1-2 punch.

**Stats strip concept (add as a new section directly after `section_yYHbaA`):**

```html
<div class="nb-stats-strip">
  <div class="nb-shell">
    <div class="nb-stats-strip__grid">
      <div class="nb-stats-strip__item">
        <span class="nb-stats-strip__number" data-count="7">7+</span>
        <span class="nb-stats-strip__label">Years coaching</span>
      </div>
      <div class="nb-stats-strip__item">
        <span class="nb-stats-strip__number" data-count="100">100+</span>
        <span class="nb-stats-strip__label">Clients coached</span>
      </div>
      <div class="nb-stats-strip__item">
        <span class="nb-stats-strip__number" data-count="15">15+</span>
        <span class="nb-stats-strip__label">Countries</span>
      </div>
      <div class="nb-stats-strip__item">
        <span class="nb-stats-strip__number" data-count="1000">1,000+</span>
        <span class="nb-stats-strip__label">Workshop attendees</span>
      </div>
    </div>
  </div>
</div>
```

```css
.nb-stats-strip {
  background: var(--nb-deep-teal, #0b3f45);
  color: #fff;
  padding: 20px 0;
}

.nb-stats-strip__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  text-align: center;
}

.nb-stats-strip__number {
  display: block;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 800;
  color: var(--nb-chocolate, #d16c28);
  line-height: 1.1;
}

.nb-stats-strip__label {
  font-size: clamp(12px, 1vw, 14px);
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

@media (max-width: 749px) {
  .nb-stats-strip__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 12px;
  }
}
```

3. **Improve logo sizing consistency** — The current custom CSS sets `.icon-block__media` to `height: 150px; object-fit: contain;`. Consider reducing to ~80–100px for a tighter, more polished strip, and ensure all logos have uniform visual weight (some may appear larger than others due to differing aspect ratios).

4. **Add subtle grayscale → color hover effect** — Apply `filter: grayscale(1); opacity: 0.7;` to the logos by default, transitioning to full color on hover. This is a classic "As Seen In" pattern that looks premium.

**File:** `templates/index.json` (section `section_yYHbaA` settings), `assets/base.css` (optional styling enhancements)
**Impact:** Medium — the existing logo bar already provides strong credibility; these are polish enhancements.

---

## 3. Navigation & Header

**Current state:** The header (`sections/header.liquid`) uses a standard Shopify Horizon layout with logo, menu, and a "Book a call" CTA injected via Liquid (line ~64: `.nb-cta[data-cta="header-cta"]`). The header supports sticky mode via `enable_sticky_header` setting and transparent mode on the homepage.

### 3.1 Make the Header CTA More Prominent

**Problem:** The "Book a call" button in the header uses the standard `.nb-cta` styling — same size and visual weight as other links. It doesn't stand out enough.

**Recommendation:** Make the header CTA larger, add a subtle glow, and animate it on scroll.

```css
/* Header CTA — make it visually dominant */
.header .nb-cta[data-cta="header-cta"] {
  background: var(--nb-chocolate, #d16c28);
  color: #fff;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 9999px;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px rgba(209, 108, 40, 0.3);
  transition: all 0.25s ease;
}

.header .nb-cta[data-cta="header-cta"]:hover {
  background: var(--nb-choc-600, #b85f23);
  box-shadow: 0 4px 20px rgba(209, 108, 40, 0.45);
  transform: translateY(-1px);
}

/* Subtle attention pulse (runs once after page load) */
@media (prefers-reduced-motion: no-preference) {
  .header .nb-cta[data-cta="header-cta"] {
    animation: nb-cta-glow 2s ease 2s 1;
  }

  @keyframes nb-cta-glow {
    0%, 100% { box-shadow: 0 2px 12px rgba(209,108,40,0.3); }
    50% { box-shadow: 0 4px 24px rgba(209,108,40,0.55); }
  }
}
```

**File:** `assets/base.css`
**Impact:** High — the CTA is the single most important conversion element on the page.

### 3.2 Sticky Header with Backdrop Blur

**Problem:** When the header becomes sticky on scroll, it can feel abrupt and heavy if it has a solid background.

**Recommendation:** Add a frosted-glass effect to the sticky header.

```css
/* Frosted glass sticky header */
#header-component[sticky].is-sticky {
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  background: rgba(255, 255, 255, 0.85) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
}
```

**File:** `assets/base.css`
**Impact:** Medium — adds a modern, premium feel to the browsing experience.

### 3.3 Coaching Services Mega-Menu

**Problem:** The navigation dropdown for coaching services is a plain text list. Visitors don't get a preview of what each service involves.

**Recommendation:** Create a mega-menu dropdown that shows service thumbnails and short descriptions. This would require modifications to the header menu block rendering in the theme. Consider using Shopify's native mega-menu capabilities or a custom dropdown.

**Structural concept:**

```
┌──────────────────────────────────────────────────────────┐
│  COACHING SERVICES                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  [image]  │  │  [image]  │  │  [image]  │  │  [image]  │ │
│  │ Executive │  │  Men's    │  │Relation- │  │  Stress  │ │
│  │ Coaching  │  │ Coaching  │  │  ship     │  │ Mgmt     │ │
│  │ For lead- │  │ Lead from │  │ Conscious │  │ Reduce   │ │
│  │ ers who…  │  │ inside…   │  │ relating  │  │ tension  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                           │
│  [Book a free 20-min call →]                              │
└──────────────────────────────────────────────────────────┘
```

**File:** `sections/header.liquid` (menu rendering), potentially a new snippet
**Impact:** Medium — helps visitors self-select the right service faster, reducing bounce.

---

## 4. Color & Visual Identity

**Current state:** The brand palette is defined in `assets/base.css` (lines 14–36):

| Token | Value | Usage |
|-------|-------|-------|
| `--nb-teal` | `#10636c` | Primary brand, headings |
| `--nb-deep-teal` | `#0b3f45` | Footer, dark panels |
| `--nb-chocolate` | `#d16c28` | Primary CTA |
| `--nb-choc-600` | `#b85f23` | CTA hover |
| `--nb-ink` | `#2f3e48` | Body text |
| `--nb-pebble` | `#f5f6f4` | Page background |
| `--nb-gainsboro` | `#e3e4dc` | Off-white canvas |
| `--nb-sage` | `#EAF4F3` | Section panels |
| `--nb-mist` | `#F3FAF8` | Soft mint panels |

### 4.1 Break Visual Monotony with Section Rhythm

**Problem:** Multiple consecutive sections use the same sage/mist panel backgrounds, creating a "wall of sameness" that fatigues the eye and reduces the perceived importance of individual sections.

**Recommendation:** Establish a deliberate alternating pattern:

```
Hero (full-bleed photo)
  ↓
Stats strip (deep teal)
  ↓
Services (white)
  ↓
Testimonials (sage/mint panel)
  ↓
About / Philosophy (white)
  ↓
Blog (warm stone)
  ↓
Get in Touch (deep teal)
  ↓
Footer (deep teal)
```

**New tokens to add:**

```css
:root {
  /* Warm stone for alternating sections */
  --nb-warm-stone: #F7F3EF;
  --nb-warm-stone-strong: #EDE7E0;

  /* Gold accent for premium callouts */
  --nb-gold: #C9A96E;
  --nb-gold-soft: rgba(201, 169, 110, 0.12);
}
```

**File:** `assets/base.css` (add to `:root` block at line ~14)
**Impact:** Medium — creates visual rhythm that keeps the eye moving down the page.

### 4.2 Photography Guidelines

For the Nibana brand to feel cohesive and premium, all photography should follow these principles:

- **Warm color temperature** — avoid cool, clinical blues. Shift toward golden-hour warmth.
- **Natural settings** — outdoors, sunlit interiors, nature. Not offices or conference rooms.
- **Human connection** — show genuine eye contact, contemplation, or meaningful interaction.
- **High contrast** — avoid flat, overcast lighting. Use directional light with depth.
- **Consistent crop style** — 16:9 for hero/banner, square for avatars, 4:3 for cards.
- **Apply the duotone helper** — use the existing `.nb-duotone` class from `nb-visuals.css` (line 60) to keep photos on-brand with a subtle mint overlay.

---

## 5. Typography

**Current state:** Typography uses `clamp()` responsive sizing throughout. Headings use `font-weight: 800` and the theme's heading font family. The `.nb-kicker` eyebrow pattern is used for section introductions. Body text in `.nb-rte` uses `line-height: 1.7`.

### 5.1 Add a Display Font for Hero Headlines

**Problem:** The hero headline uses the same font as all other headings. This misses an opportunity to create a distinct, memorable first impression.

**Recommendation:** Add a display/serif font for hero-level headlines only. Good candidates for a coaching brand:

- **Playfair Display** — elegant, editorial
- **Cormorant Garamond** — refined, literary
- **DM Serif Display** — modern, warm

Implementation via Shopify's font picker: Set the "Accent font" (`--font-accent--family`) in Theme Settings → Typography to a serif display font. Then apply it only to hero headlines:

```css
/* Display font for hero headlines only */
.hero .group-block-content [class*="h1"],
.nb-about-hero .nb-h1,
.nb-hero__title {
  font-family: var(--font-accent--family, 'Playfair Display', serif);
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

**File:** `assets/base.css`
**Impact:** Medium — creates a distinctive first impression that differentiates from other coaching sites.

### 5.2 Pull-Quote Styling for Testimonials

**Problem:** Testimonial quotes use standard body text styling. They don't visually "pop" as featured quotes.

```css
/* Pull-quote styling for featured testimonials */
.nb-pullquote {
  font-family: var(--font-accent--family, inherit);
  font-size: clamp(20px, 2.2vw, 28px);
  font-style: italic;
  line-height: 1.45;
  color: var(--nb-teal, #10636c);
  position: relative;
  padding-left: 24px;
  border-left: 3px solid var(--nb-chocolate, #d16c28);
  margin: 24px 0;
}

.nb-pullquote::before {
  content: "\201C"; /* left double quote */
  position: absolute;
  top: -8px;
  left: -4px;
  font-size: 48px;
  color: var(--nb-chocolate, #d16c28);
  opacity: 0.3;
  line-height: 1;
}
```

**File:** `assets/base.css`
**Impact:** Low-Medium — adds editorial polish to testimonial sections.

### 5.3 Clean Up Duplicate CSS

**Problem:** The `.nb-cta` class is defined twice in `base.css` — once at approximately line 5212 and again at approximately line 5268. This causes specificity confusion and wasted bytes.

**Recommendation:** Merge the two definitions into a single, consolidated block. Remove the duplicate and ensure all properties are in one place.

**File:** `assets/base.css` (lines ~5212–5302)
**Impact:** Low — technical hygiene that prevents future bugs.

---

## 6. Homepage Section-by-Section

### 6.1 Services Grid

**Current state:** `sections/services.liquid` displays a basic grid of service items — image + title wrapped in a link. Hover only scales the image by 2%. No descriptions, no visual depth, no animations.

**Recommendation:** Transform into an engaging card grid with overlays, descriptions, and staggered entrances.

```css
/* Enhanced service cards */
.service-item {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
}

/* Overlay that slides up on hover */
.service-item::after {
  content: "Learn more →";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(11, 63, 69, 0.9), transparent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.service-item:hover::after {
  transform: translateY(0);
}

/* Staggered entrance animation */
@media (prefers-reduced-motion: no-preference) {
  .service-item {
    opacity: 0;
    transform: translateY(16px);
    animation: nb-card-enter 0.5s ease forwards;
  }
  .service-item:nth-child(1) { animation-delay: 0.1s; }
  .service-item:nth-child(2) { animation-delay: 0.2s; }
  .service-item:nth-child(3) { animation-delay: 0.3s; }
  .service-item:nth-child(4) { animation-delay: 0.4s; }
  .service-item:nth-child(5) { animation-delay: 0.5s; }
  .service-item:nth-child(6) { animation-delay: 0.6s; }

  @keyframes nb-card-enter {
    to { opacity: 1; transform: translateY(0); }
  }
}
```

**Structural enhancement** — add a short description to each service block in `services.liquid`:

```html
<!-- Enhanced service card -->
<div class="service-item">
  <a href="{{ block.settings.link }}">
    <img src="{{ block.settings.image | image_url: width: 600 }}"
         alt="{{ block.settings.title | escape }}" loading="lazy">
    <div class="service-title">{{ block.settings.title }}</div>
    {% if block.settings.description != blank %}
      <p class="service-desc">{{ block.settings.description }}</p>
    {% endif %}
  </a>
</div>
```

Add a `description` setting to the service block schema:

```json
{
  "type": "textarea",
  "id": "description",
  "label": "Short description",
  "default": "A brief description of this coaching service."
}
```

**File:** `sections/services.liquid`
**Impact:** High — services are the core offering; making them visually engaging directly increases exploration.

### 6.2 Testimonials Slider

**Current state:** `sections/nb-testimonials-slider.liquid` is a well-built horizontal carousel using CSS scroll-snap, with arrow/dot navigation and ResizeObserver for responsive page detection. Cards use the `nb-testimonial-card` snippet.

**Recommendations:**

1. **Add star ratings** — Add a visual 5-star rating above each quote for instant social proof scanning.

2. **Larger avatars** — Client photos should be more prominent (currently optional). Make them 56px circles with a teal border.

```css
/* Enhanced testimonial card avatars */
.nb-tcard__avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--nb-teal, #10636c);
  object-fit: cover;
  margin-bottom: 8px;
}

/* Star rating */
.nb-tcard__stars {
  color: var(--nb-chocolate, #d16c28);
  font-size: 16px;
  letter-spacing: 2px;
  margin-bottom: 8px;
}
```

3. **Auto-advance on desktop** — Add a slow auto-scroll (every 6 seconds) that pauses on hover.

**File:** `sections/nb-testimonials-slider.liquid`, `snippets/nb-testimonial-card.liquid`
**Impact:** Medium — enhances the persuasive power of existing testimonials.

### 6.3 Trust Belt

**Current state:** `sections/nb-trustbelt.liquid` renders items as a marquee belt or grid, sourced from manual text or a metaobject. Currently shows text items like "Trusted by founders."

**Recommendations:**

1. **Add logos** — If Nibana has been featured in media (podcasts, publications, events), add their logos. The existing `nb-media-press.liquid` section already supports this.

2. **Add credential badges** — ICF certification, coaching methodology badges, etc.

3. **Keep it near the top** — The homepage already has a social proof logo bar (GQ, TEDx, etc.) directly below the hero. Consider placing the trust belt immediately after that logo bar to stack credibility signals early on the page.

**File:** `sections/nb-trustbelt.liquid`, `templates/index.json` (reorder sections)
**Impact:** High — trust elements work best when they appear before the first CTA.

### 6.4 Get in Touch Section

**Current state:** `sections/home-get-in-touch.liquid` is a centered card panel with a kicker, heading, copy, primary CTA, secondary link, and a small note. Background is `#F3FAF8` (mint).

**Recommendations:**

1. **Add a warm, inviting photo** — Place a professional photo of Kapil alongside the text to humanize the CTA.

2. **Reduce friction in copy** — Change "If you're exploring coaching" to something more direct:
   - "Let's have a conversation — no strings attached"
   - "Your transformation starts with a single conversation"

3. **Add reassurance microcopy** below the CTA button:

```html
<a class="nb-cta" href="{{ section.settings.cta_link }}">
  {{ section.settings.cta_label }}
</a>
<span class="nb-cta-reassurance">Free. Confidential. No obligation.</span>
```

```css
.nb-cta-reassurance {
  display: block;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 8px;
  letter-spacing: 0.02em;
}
```

**File:** `sections/home-get-in-touch.liquid`
**Impact:** High — the final CTA on the page is the last chance to convert before footer.

---

## 7. Coaching Service Pages

**Current state:** Coaching service pages use `sections/coaching-service.liquid`, which is driven by metaobjects (`coachingservice` type). Each page renders: hero, outcomes grid, image+list tray, process steps, method/approach, FAQ, trust belt, and a final CTA. The layout uses the `.nb-coaching` wrapper class with comprehensive mobile fixes in `assets/nb-coaching.css`.

### 7.1 Hero Section

**Recommendation:** The coaching service hero uses `.nb-h1` (30–48px) with the kicker pattern. Enhance it with:

- **A short video testimonial clip** (15–30 seconds) as the hero media instead of a static image
- **"For you if…" qualifier** — Add a sentence like "For founders and executives who've achieved external success but feel something is missing" to pre-qualify the visitor

### 7.2 Outcomes Section

**Current state:** Outcomes are displayed as cards with hover lift.

**Recommendation:** Add numbered markers or icons to each outcome to create a scannable visual hierarchy:

```css
/* Numbered outcome cards */
.nb-outcome {
  position: relative;
  padding-left: 48px;
}

.nb-outcome::before {
  content: counter(outcome-counter);
  counter-increment: outcome-counter;
  position: absolute;
  left: 12px;
  top: 12px;
  width: 28px;
  height: 28px;
  background: var(--nb-chocolate, #d16c28);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.nb-outcomes__grid {
  counter-reset: outcome-counter;
}
```

**File:** `sections/coaching-service.liquid`
**Impact:** Medium — helps visitors mentally "stack" the benefits.

### 7.3 Process / How It Works

**Recommendation:** Transform the process steps into a visual timeline with connecting lines:

```css
/* Process timeline */
.nb-steps {
  position: relative;
  padding-left: 32px;
}

.nb-steps::before {
  content: "";
  position: absolute;
  left: 12px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--nb-chocolate), var(--nb-teal));
}

.nb-steps li {
  position: relative;
  margin-bottom: 24px;
  padding-left: 24px;
}

.nb-steps li::before {
  content: "";
  position: absolute;
  left: -24px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--nb-chocolate, #d16c28);
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px var(--nb-chocolate);
}
```

**File:** `sections/coaching-service.liquid`
**Impact:** Medium — transforms a text list into a visual journey.

### 7.4 FAQ Section

**Current state:** `sections/nb-faq.liquid` uses `<details>/<summary>` with styled accordions. Has JSON-LD support for SEO.

**Recommendation:** The FAQ implementation is solid. Minor enhancements:

- Add a subtle slide-down animation when opening (currently instant)
- Add a "Still have questions?" CTA at the bottom of the FAQ linking to the contact page

```css
/* Smooth FAQ open animation */
.nb-faq__a {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  padding: 0 16px;
}

.nb-faq__item[open] .nb-faq__a {
  max-height: 500px;
  opacity: 1;
  padding: 14px 16px;
}
```

**File:** `sections/nb-faq.liquid`
**Impact:** Low — polish enhancement.

### 7.5 CTA Placement on Service Pages

**Recommendation:** Add a mid-page CTA after the outcomes section (before the method/approach). Many visitors won't scroll to the bottom. Catching them mid-page doubles conversion opportunities.

Use the existing `sections/cta-bar.liquid` section configured with:
- Heading: "Ready to start your transformation?"
- Button: "Book a free 20-min call"
- Background: `var(--nb-warm-stone)` for visual contrast

---

## 8. About Page

**Current state:** The about page uses multiple custom sections: `about-hero.liquid`, `about-who.liquid`, `about-different.liquid`, `about-how.liquid`, `about-philosophy.liquid`, `about-founder.liquid`, `about-testimonials.liquid`, and `about-final-cta.liquid`. All share consistent panel styling from `nb-visuals.css` (rounded corners, mint shadows, luxe inner gradients).

### 8.1 About Hero

**Current state:** `sections/about-hero.liquid` displays a split layout (text left, image right on desktop) with kicker, h1, blurb, and CTA.

**Recommendations:**

1. **Add a short intro video** — A 60-second video of Kapil speaking directly to camera is more powerful than any written copy. Add as an alternative to the static image.

2. **Refine the headline** — "Coaching for steady clarity & aliveness" is good but could be more emotionally resonant. Consider: "We help leaders feel as successful as they look."

3. **Add a scroll indicator** — A subtle animated chevron/arrow at the bottom of the hero encouraging visitors to scroll.

```css
/* Scroll indicator */
.nb-scroll-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.6;
  animation: nb-bounce 2s infinite;
}

@keyframes nb-bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}
```

### 8.2 About — Who We Help

**Recommendation:** Make the target audience section more visually impactful by using persona cards with icons rather than plain text:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    [icon]    │  │    [icon]    │  │    [icon]    │
│   Founders   │  │    CXOs     │  │   Couples    │
│  & Creators  │  │ & Executives│  │ & Partners   │
│              │  │              │  │              │
│ "I've built  │  │ "I look     │  │ "We love     │
│  something   │  │  successful  │  │  each other  │
│  but feel    │  │  but feel    │  │  but feel    │
│  empty"      │  │  depleted"   │  │  stuck"      │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 8.3 About — Founder Section

**Recommendation:** The founder section should feel personal and intimate:

1. **Large, warm photo** of Kapil — not a formal headshot but a natural, approachable shot
2. **First-person voice** — "I started Nibana because…" not "Kapil founded Nibana…"
3. **Credentials as a subtle footnote**, not the headline — let the story lead

### 8.4 About — Final CTA

**Recommendation:** The `about-final-cta.liquid` section should use the warm stone background for contrast and include a testimonial quote alongside the CTA:

```
┌──────────────────────────────────────────────────┐
│                                                    │
│  "Working with Kapil changed how I show up        │
│   as a leader and as a partner."                   │
│   — James K., CEO                                  │
│                                                    │
│  [Book a free 20-min call]  [Learn about coaching] │
│                                                    │
│  Free. Confidential. No obligation.                │
└──────────────────────────────────────────────────┘
```

---

## 9. Blog

**Current state:** `sections/our-blog.liquid` displays a grid of blog cards with 16:9 images, tags/date metadata, title (clamped to 2 lines), excerpt, and a "Read more" button. Cards have a mint panel background (`#eaf5f4`) with rounded corners and hover shadow.

### 9.1 Featured Article

**Problem:** All blog posts are treated equally in the grid. There's no way to highlight a flagship article.

**Recommendation:** Make the first article in the grid span 2 columns with a larger image:

```css
/* Featured blog post (first child) */
.custom-blog-grid .blog-card:first-child {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0;
}

.custom-blog-grid .blog-card:first-child img {
  aspect-ratio: 3/2;
  height: 100%;
}

@media (max-width: 749px) {
  .custom-blog-grid .blog-card:first-child {
    grid-template-columns: 1fr;
  }
}
```

**File:** `sections/our-blog.liquid`
**Impact:** Medium — creates visual hierarchy in the blog section.

### 9.2 Reading Time Estimates

**Recommendation:** Add estimated reading time to blog card metadata:

```liquid
{% assign word_count = article.content | strip_html | split: ' ' | size %}
{% assign reading_time = word_count | divided_by: 200 | plus: 1 %}
<span class="blog-reading-time">{{ reading_time }} min read</span>
```

```css
.blog-reading-time {
  font-size: 12px;
  color: var(--nb-teal, #10636c);
  font-weight: 600;
}
```

**File:** `sections/our-blog.liquid`
**Impact:** Low — reduces friction by setting expectations.

### 9.3 Blog Page Improvements

For the full blog listing page (`templates/blog.json`):

- Add category/tag filtering for different coaching topics
- Add a newsletter signup CTA between blog post rows
- Add related articles at the bottom of each article page

---

## 10. Contact & Booking Pages

### 10.1 Book-a-Call Page

**Current state:** Uses `sections/nb-calendly.liquid` to embed a Calendly widget.

**Recommendations:**

1. **Add context above the calendar** — Before the Calendly embed, add:
   - A photo of Kapil with a warm greeting
   - "What to expect" bullet points (3 items max)
   - A reassurance statement: "This is a casual conversation, not a sales pitch"

2. **Trust elements near the calendar:**

```html
<div class="nb-book-trust">
  <div class="nb-book-trust__item">
    <svg><!-- checkmark icon --></svg>
    <span>100% free, no obligation</span>
  </div>
  <div class="nb-book-trust__item">
    <svg><!-- clock icon --></svg>
    <span>20 minutes, focused on you</span>
  </div>
  <div class="nb-book-trust__item">
    <svg><!-- lock icon --></svg>
    <span>Completely confidential</span>
  </div>
</div>
```

```css
.nb-book-trust {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 16px 0 24px;
}

.nb-book-trust__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--nb-ink, #2f3e48);
}

.nb-book-trust__item svg {
  width: 18px;
  height: 18px;
  color: var(--nb-teal, #10636c);
  flex-shrink: 0;
}
```

### 10.2 Contact Page

**Current state:** Uses `sections/nibana-contact.liquid`.

**Recommendations:**

1. **Multiple contact channels** — Offer email, phone, WhatsApp, and social links side by side
2. **Response time expectation** — "We reply within 1–2 business days" (already in the home contact section — ensure consistency)
3. **Location indicator** — "Based in London, working globally" with a subtle map or globe icon
4. **FAQ link** — "Check our FAQ" for common questions before reaching out

---

## 11. CTA Strategy

### 11.1 CTA Button Pulse Animation

**Problem:** CTA buttons (`.nb-cta`) use a solid chocolate background with a subtle hover lift. They don't actively draw the eye.

**Recommendation:** Add a gentle pulse/glow animation that plays periodically to attract attention:

```css
/* CTA attention pulse — plays every 8 seconds */
@media (prefers-reduced-motion: no-preference) {
  .nb-cta[data-cta="hero-cta"],
  .nb-cta[data-cta="about-hero-cta"],
  .nb-home-contact .nb-cta {
    animation: nb-pulse 8s ease infinite;
  }

  @keyframes nb-pulse {
    0%, 85%, 100% {
      box-shadow: 0 2px 8px rgba(209, 108, 40, 0.2);
    }
    90% {
      box-shadow: 0 4px 24px rgba(209, 108, 40, 0.5);
    }
    95% {
      box-shadow: 0 2px 16px rgba(209, 108, 40, 0.35);
    }
  }
}
```

**File:** `assets/base.css`
**Impact:** High — draws attention without being aggressive.

### 11.2 Existing Floating Mobile CTA — Enhancement Opportunities

**Current state:** The site already has a well-implemented floating mobile CTA system:

- **`.nb-fab`** — A fixed-position pill button (chocolate background, pill-shaped, right-aligned) visible on mobile (≤1024px). Styled in `assets/base.css:4976` and `layout/theme.liquid:370`.
- **`snippets/nb-sticky-cta-controller.liquid`** — Smart visibility controller using `IntersectionObserver` that auto-hides the floating CTA when a booking link is already visible on screen. Detects Calendly, cal.com, tidycal, and custom `[data-cta="book-call"]` elements.
- **FAB lift logic** — JS in `layout/theme.liquid:413` that detects Mailchimp bottom bars and lifts the FAB above them with a configurable gap.
- **Analytics** — Pushes `cta_sticky_click` events to `dataLayer`.
- The header CTA is already hidden on mobile (`sections/header.liquid:821`) to avoid redundancy.

**Recommendations to enhance the existing FAB:**

1. **Add a subtle entrance animation** — The FAB appears instantly. Add a slide-up entrance after a short delay:

```css
@media (prefers-reduced-motion: no-preference) {
  .nb-fab {
    animation: nb-fab-enter 0.4s ease 1.5s both;
  }

  @keyframes nb-fab-enter {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}
```

2. **Add a periodic attention pulse** — Draw the eye with a subtle glow every 10 seconds:

```css
@media (prefers-reduced-motion: no-preference) {
  .nb-fab > a {
    animation: nb-fab-pulse 10s ease 3s infinite;
  }

  @keyframes nb-fab-pulse {
    0%, 92%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    96% { box-shadow: 0 8px 32px rgba(209,108,40,.4); }
  }
}
```

3. **Add reassurance microcopy** — Consider adding a small "Free · 20 min" label below or beside the FAB button text.

**File:** `assets/base.css`, `layout/theme.liquid`
**Impact:** Low-Medium — the core feature already works well; these are polish improvements.

### 11.3 CTA Copy Variations to A/B Test

| Current | Alternative A | Alternative B |
|---------|--------------|--------------|
| "Book a call" | "Let's talk" | "Start here" |
| "Book a free 20-min call" | "Schedule your free conversation" | "Get clarity in 20 minutes" |
| "BOOK YOUR FREE SESSION NOW!" | "Start your transformation" | "Take the first step" |

**Recommendation:** The all-caps "BOOK YOUR FREE SESSION NOW!" in `sections/cta-bar.liquid` (default setting) feels aggressive for a luxury coaching brand. Soften to sentence case and reduce urgency signaling.

### 11.4 Ghost/Secondary CTAs

**Current state:** `.nb-cta--ghost` exists in `base.css` (transparent background, chocolate text) but is rarely used.

**Recommendation:** Use ghost CTAs for secondary actions on content pages:
- "Learn about our approach" on the about page
- "Read client stories" on coaching service pages
- "View all testimonials" (already used in testimonials slider)

---

## 12. Mobile UX

### 12.1 Current Mobile State

The mobile experience is handled primarily through `assets/nb-coaching.css`, which uses heavy `!important` overrides to force single-column layouts at `max-width: 749.98px`. This suggests the desktop layout was built first and mobile was retrofitted.

Key mobile patterns already in place:
- Grid → single column forcing
- Overflow clipping on `.nb-coaching`
- Media max-width enforcement
- Slider width normalization

### 12.2 Thumb Zone Optimization

**Problem:** Primary CTAs are often positioned at the top or center of the viewport, outside the natural thumb reach zone (bottom 40% of screen).

**Recommendations:**

1. **Floating mobile CTA already exists** (`.nb-fab`) — see Section 11.2 for enhancement ideas
2. **Move key CTAs to bottom of card panels** — ensure the CTA is the last element in stacked mobile cards
3. **Tap target sizing** — ensure all interactive elements are minimum 48px height:

```css
@media (max-width: 749px) {
  .nb-cta,
  .nb-faq__q,
  .nb-tcarousel__btn,
  .cta-bar-button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
  }
}
```

**File:** `assets/base.css`
**Impact:** Medium — improves one-handed usability.

### 12.3 Mobile Typography

```css
@media (max-width: 749px) {
  /* Increase body text for readability on small screens */
  .nb-rte p,
  .nb-copy {
    font-size: 16px;
    line-height: 1.75;
  }

  /* Ensure headings don't get too small */
  .nb-h1 {
    font-size: max(28px, clamp(28px, 7vw, 36px));
  }

  .nb-h2 {
    font-size: max(22px, clamp(22px, 5vw, 28px));
  }
}
```

### 12.4 Mobile Navigation Enhancement

**Recommendation:** Consider a bottom tab bar for mobile (replaces the hamburger menu for key pages):

```
┌──────────────────────────────────────────┐
│  Home   │  Services  │  Book  │  About   │
│   🏠    │     💡     │   📞   │    👤    │
└──────────────────────────────────────────┘
```

This keeps the most important pages always accessible without opening the hamburger menu. The "Book" tab should use the chocolate brand color to stand out.

---

## 13. Micro-interactions & Animation

### 13.1 Existing Animation System

The theme has a lightweight animation system in `assets/nb-visuals.css`:
- `[data-anim]` attribute with `.is-inview` class toggle
- `translateY(8px)` entrance with `0.22s` transition
- Respects `prefers-reduced-motion: no-preference`
- Hover lifts on cards: `translateY(-1px)` with `box-shadow` enhancement

### 13.2 Scroll-Triggered Number Counter

For the stats strip (Section 2.3), add a counting animation:

```javascript
// Add to a new file: assets/nb-counter.js
document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.textContent.replace(/[\d,]/g, '');

      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString() + suffix;
        observer.unobserve(el);
        return;
      }

      let current = 0;
      const duration = 1500;
      const step = target / (duration / 16);

      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toLocaleString() + suffix;
        if (current < target) requestAnimationFrame(tick);
      };

      tick();
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
});
```

**File:** New file `assets/nb-counter.js`, loaded in `layout/theme.liquid`
**Impact:** Medium — adds delight and draws attention to credibility numbers.

### 13.3 Enhanced Button Hover

```css
/* Richer button hover with arrow slide */
.nb-cta {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.nb-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(209, 108, 40, 0.3);
}

/* Optional: arrow that slides in on hover */
.nb-cta--arrow::after {
  content: " →";
  display: inline-block;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s ease;
}

.nb-cta--arrow:hover::after {
  opacity: 1;
  transform: translateX(0);
}
```

**File:** `assets/base.css`
**Impact:** Low — subtle polish.

### 13.4 Page View Transitions

**Current state:** The theme already includes view-transition support in `layout/theme.liquid`.

**Recommendation:** Enable CSS view transitions for smoother page navigation:

```css
@view-transition {
  navigation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.25s;
}
```

**File:** `assets/base.css`
**Impact:** Low — modern enhancement for supported browsers.

---

## 14. Social Proof & Trust

### 14.1 Strategic Placement

Social proof is most effective when placed:
1. **Immediately after the hero** — Trust belt or stats strip
2. **Adjacent to CTAs** — Mini-testimonial or trust badges next to "Book a call"
3. **On coaching service pages** — Service-specific testimonials
4. **On the booking page** — "Join 100+ leaders who've transformed their lives"

### 14.2 Inline Mini-Testimonials

Place short quotes next to primary CTAs throughout the site:

```html
<div class="nb-inline-proof">
  <img class="nb-inline-proof__avatar" src="..." alt="Client">
  <blockquote class="nb-inline-proof__quote">
    "This changed everything for me."
    <cite>— Sarah M., CEO</cite>
  </blockquote>
</div>
```

```css
.nb-inline-proof {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(243, 250, 248, 0.6);
  border-radius: 12px;
  border-left: 3px solid var(--nb-teal, #10636c);
}

.nb-inline-proof__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.nb-inline-proof__quote {
  font-size: 14px;
  line-height: 1.4;
  color: var(--nb-ink, #2f3e48);
  font-style: italic;
  margin: 0;
}

.nb-inline-proof__quote cite {
  display: block;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  margin-top: 4px;
  color: var(--nb-teal, #10636c);
}
```

**File:** New snippet `snippets/nb-inline-proof.liquid`, referenced near CTAs
**Impact:** High — social proof near CTAs can increase conversion by 15–30%.

### 14.3 Video Testimonials

**Recommendation:** Create a dedicated video testimonial section with play buttons:

- 3–4 short clips (60–90 seconds each)
- Thumbnail with a play button overlay
- Name and title below each video
- Opens in a lightbox/modal when clicked

This leverages the existing `sections/video-banner.liquid` section pattern.

### 14.4 "As Seen In" Media Bar

**Current state:** The homepage already has a social proof logo bar (`section_yYHbaA`) directly below the hero showing GQ, TEDx Lambeth, Ministry of Justice, Thrive Global, and The Good Men Project logos. This is well-placed and effective. The theme also has `sections/nb-media-press.liquid` for a more detailed media mentions section used on the Media & Press page.

**Recommendation:** The existing homepage logo bar is in an excellent position. Enhance it with a subtle "As Featured In" heading and consider the grayscale-to-color hover effect described in section 2.3. If more media features are added in future, they can be showcased on the dedicated Media & Press page using `nb-media-press.liquid`.

---

## 15. Accessibility

### 15.1 Current Accessibility Foundation

The theme has good accessibility basics:
- `focus-visible` rings on interactive elements (`nb-visuals.css` lines 284–301)
- `prefers-reduced-motion` support for marquee and scroll (`nb-visuals.css` lines 313–316)
- Semantic HTML with `<section>`, `<header>`, `<details>/<summary>` for FAQ
- ARIA labels on carousel buttons (`aria-label="Previous"`, `aria-label="Next"`)

### 15.2 Color Contrast Audit

| Combination | Ratio | WCAG AA (4.5:1) | Status |
|------------|-------|-----------------|--------|
| `--nb-teal` (#10636c) on white (#fff) | 5.2:1 | Pass | OK |
| `--nb-chocolate` (#d16c28) on white (#fff) | 3.4:1 | **Fail** | Needs fix |
| `--nb-ink` (#2f3e48) on white (#fff) | 8.7:1 | Pass | OK |
| `--nb-ink` on `--nb-pebble` (#f5f6f4) | 7.9:1 | Pass | OK |
| `--nb-muted` (#51615d) on white (#fff) | 5.1:1 | Pass | OK |
| White (#fff) on `--nb-chocolate` (#d16c28) | 3.4:1 | **Fail for small text** | Needs fix |
| White (#fff) on `--nb-deep-teal` (#0b3f45) | 10.8:1 | Pass | OK |

**Critical fix:** The chocolate CTA buttons (`--nb-chocolate: #d16c28` with white text) **fail WCAG AA** for normal-sized text. Options:

1. **Darken the chocolate** — change `--nb-chocolate` to `#B35A1F` (ratio: 4.6:1, passes AA)
2. **Increase button text size** — use 18px+ bold, which only requires 3:1 ratio (current passes for large text)
3. **Both** — darken slightly to `#C0601F` and keep text at 14px+ bold

**Recommended fix:**

```css
:root {
  --nb-chocolate: #B85A1E; /* darkened for AA compliance */
  --nb-choc-600: #A04F1A;  /* adjusted hover */
}
```

**File:** `assets/base.css` (lines ~29–30)
**Impact:** High — legal compliance and inclusive access.

### 15.3 Skip-to-Content Link

**Recommendation:** Add a skip link for keyboard users (add to `layout/theme.liquid` as the first child of `<body>`):

```html
<a href="#MainContent" class="nb-skip-link">Skip to content</a>
```

```css
.nb-skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  padding: 12px 20px;
  background: var(--nb-deep-teal, #0b3f45);
  color: #fff;
  font-weight: 700;
  border-radius: 0 0 8px 8px;
  z-index: 9999;
  transition: top 0.2s ease;
}

.nb-skip-link:focus {
  top: 0;
}
```

**File:** `layout/theme.liquid`, `assets/base.css`
**Impact:** Medium — essential for keyboard-only users.

### 15.4 Image Alt Text

**Recommendation:** Audit all images across the site for meaningful alt text:
- Service images: describe the service, not the photo (e.g., "Executive coaching session" not "man sitting at desk")
- Decorative images: use `alt=""` with `role="presentation"`
- Blog images: describe the content of the article visually

---

## 16. Performance

### 16.1 Current State

- `assets/base.css` is 5,706 lines — this is large for a single CSS file
- Multiple CSS files loaded globally: `base.css`, `nb-coaching.css`, `nb-visuals.css`, `nb-contact.css`, etc.
- Images use Shopify's CDN with responsive `srcset` and `sizes` attributes
- Hero images use `fetchpriority: 'high'` for LCP optimization
- Lazy loading (`loading="lazy"`) on below-fold images

### 16.2 CSS Optimization

**Recommendations:**

1. **Conditional CSS loading** — Only load `nb-coaching.css` on coaching service pages:

```liquid
{%- if template contains 'coaching' -%}
  {{ 'nb-coaching.css' | asset_url | stylesheet_tag }}
{%- endif -%}
```

2. **Remove duplicate CSS** — The duplicate `.nb-cta` definitions and the triple-defined heading normalization in `base.css` add unnecessary bytes.

3. **Reduce `!important` usage** — The heading normalization block (lines ~74–132) uses `!important` on every property. This makes overrides difficult and adds specificity weight. Consider using higher-specificity selectors or CSS layers instead.

### 16.3 Image Optimization

**Recommendations:**

1. **WebP format** — Shopify's CDN automatically serves WebP when supported. Ensure all uploaded images are high-quality originals (the CDN handles compression).

2. **Appropriate sizing** — The hero loads images up to 3840px wide. For most screens, 1920px is sufficient. Consider capping at `width: 2560` for hero images.

3. **Lazy-load sections** — Use Shopify's native section lazy-loading for below-fold sections.

### 16.4 JavaScript Optimization

**Recommendations:**

1. **Defer non-critical JS** — The testimonial slider JS, FAQ accordion, and counter animations should use `defer` or load only when the section enters the viewport.

2. **Use `IntersectionObserver`** — The existing `[data-anim]` system should use `IntersectionObserver` (it may already — verify in `assets/critical.js`).

---

## 17. Implementation Priority Matrix

| # | Recommendation | Impact | Effort | Priority | Files |
|---|---------------|--------|--------|----------|-------|
| 1 | Enhance existing mobile FAB (animation/pulse) | Low-Med | Quick | **P3** | `assets/base.css` |
| 2 | Hero overlay contrast fix | High | Quick | **P1** | Theme Editor / `assets/base.css` |
| 3 | CTA pulse animation | High | Quick | **P1** | `assets/base.css` |
| 4 | Fix CTA color contrast (a11y) | High | Quick | **P1** | `assets/base.css` |
| 5 | Reassurance microcopy below CTAs | High | Quick | **P1** | `sections/home-get-in-touch.liquid`, `sections/cta-bar.liquid` |
| 6 | Enhance existing logo bar + add stats strip | Medium | Medium | **P3** | `templates/index.json`, `assets/base.css` |
| 7 | Service card hover overlays | High | Medium | **P2** | `sections/services.liquid` |
| 8 | Inline mini-testimonials near CTAs | High | Medium | **P2** | New snippet, multiple sections |
| 9 | Animated hero entrance | Medium | Quick | **P2** | `assets/base.css` |
| 10 | Alternating section backgrounds | Medium | Quick | **P2** | `assets/base.css` |
| 11 | Sticky header backdrop blur | Medium | Quick | **P2** | `assets/base.css` |
| 12 | Skip-to-content link | Medium | Quick | **P2** | `layout/theme.liquid`, `assets/base.css` |
| 13 | Trust belt placed after existing logo bar | Medium | Quick | **P3** | `templates/index.json` |
| 14 | Booking page trust elements | High | Medium | **P2** | Booking page template |
| 15 | Featured blog post layout | Medium | Medium | **P3** | `sections/our-blog.liquid` |
| 16 | Pull-quote styling | Medium | Quick | **P3** | `assets/base.css` |
| 17 | Scroll-triggered counters | Medium | Medium | **P3** | New JS file |
| 18 | Display font for hero headlines | Medium | Quick | **P3** | Theme Settings, `assets/base.css` |
| 19 | Process timeline visual | Medium | Medium | **P3** | `sections/coaching-service.liquid` |
| 20 | FAQ smooth open animation | Low | Quick | **P3** | `sections/nb-faq.liquid` |
| 21 | Mobile bottom tab bar | Medium | Heavy | **P3** | `layout/theme.liquid`, `assets/base.css` |
| 22 | Mega-menu for coaching services | Medium | Heavy | **P4** | `sections/header.liquid` |
| 23 | Video testimonial section | High | Heavy | **P4** | New section |
| 24 | View transitions | Low | Quick | **P4** | `assets/base.css` |
| 25 | CSS cleanup (duplicates, !important) | Low | Medium | **P4** | `assets/base.css` |
| 26 | Conditional CSS loading | Low | Quick | **P4** | `layout/theme.liquid` |
| 27 | Reading time on blog cards | Low | Quick | **P4** | `sections/our-blog.liquid` |

### Priority Legend

- **P1** — Do first. High impact, low effort. These are the "no-brainer" improvements.
- **P2** — Do next. High impact, moderate effort. Worth the investment.
- **P3** — Plan for. Medium impact, varying effort. Nice to have, schedule when time permits.
- **P4** — Backlog. Lower priority or heavy effort. Tackle when core improvements are solid.

---

## Appendix: Design Token Reference

### Current Tokens (from `assets/base.css`)

```css
:root {
  /* Brand core */
  --nb-teal:        #10636c;
  --nb-teal-700:    #0f5b62;
  --nb-deep-teal:   #0b3f45;

  /* Editorial neutrals */
  --nb-gainsboro:   #e3e4dc;
  --nb-pebble:      #f5f6f4;
  --nb-ink:         #2f3e48;

  /* Warm accents */
  --nb-chocolate:   #d16c28;
  --nb-choc-600:    #b85f23;
  --nb-saddle:      #7d2921;

  /* Generic */
  --nb-white:       #ffffff;
  --nb-black:       #101214;

  /* Surface & panels */
  --nb-sage:        #EAF4F3;
  --nb-sage-surface:#F7FAF9;
  --nb-mist:        #F3FAF8;

  /* Layout */
  --nb-radius-lg:   20px;
  --nb-radius-md:   12px;
  --nb-shadow-1:    0 10px 28px rgba(0,0,0,.06);
  --nb-shadow-2:    0 6px 20px rgba(0,0,0,.10);

  /* Hover */
  --hover-lift-amount: 4px;
  --hover-scale-amount: 1.03;
  --hover-transition-duration: 0.25s;
}
```

### Proposed New Tokens

```css
:root {
  /* Warm stone (for alternating sections) */
  --nb-warm-stone:       #F7F3EF;
  --nb-warm-stone-strong:#EDE7E0;

  /* Gold accent (for premium callouts) */
  --nb-gold:             #C9A96E;
  --nb-gold-soft:        rgba(201, 169, 110, 0.12);
}
```

---

*Last updated: February 2026*
*Theme: Shopify Horizon v2.0.1 (customized for Nibana)*
*Repository: nibana-theme*
