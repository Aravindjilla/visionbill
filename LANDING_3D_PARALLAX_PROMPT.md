# VisionBill Landing — 3D Interactive Parallax Scrolling Prompt

> Feed this entire prompt to Antigravity to implement a world-class cinematic landing page.

---

You are a senior creative frontend engineer specialising in immersive web experiences.
Work inside the existing project at `vision-bill-landing/`.

## Project Context

Stack already installed and ready to use — do NOT install anything new:
- React 19 + Vite 8 + TypeScript + Tailwind CSS 3
- framer-motion 12 (useScroll, useTransform, useSpring, useInView, AnimatePresence, motion)
- @react-three/fiber 9 + @react-three/drei 10 + three 0.183 (Canvas, useFrame, MeshTransmissionMaterial, MeshDistortMaterial, ContactShadows, Float, Environment, PerspectiveCamera)
- @studio-freight/lenis (smooth scroll, already wired in App.tsx useEffect)
- Existing components: VisionPrism3D.tsx, SavingsPulse3D.tsx, FloatingPhysicalGoods.tsx, VisionSphere3D.tsx, VisionCursor.tsx, Tilt.tsx, ReceiptSlider.tsx

Brand colours (already used throughout, do not change):
- Primary / Mint:  #4ade80  (emerald-400)
- Secondary / Sky: #38bdf8  (sky-400)
- Accent / Indigo: #6366f1
- Background:      #050505  (near-black)
- Glass border:    rgba(255,255,255,0.08)
- Text:            white, white/60 muted, white/30 disabled

Fonts: Outfit (headings, 600-900), Inter (body, 400-700) — already loaded.

CSS helpers already in index.css: `.glass`, `.glass-elite`, `.glass-strong`, `.text-gradient`, `.bg-mesh`, `.mesh-blob`, `.grain-overlay`, `@keyframes move`, `@keyframes float`.

---

## Goal

Rebuild `src/App.tsx` and update the existing component files to implement a world-class
3D interactive parallax scrolling experience. The page must feel like a premium Apple/Linear/Vercel
landing page — cinematic, physics-driven, and deeply responsive to scroll position and
mouse movement. Every section must have a clear scroll-driven 3D or parallax story.

Do NOT change the copy text, section names, pricing tiers, testimonials, or FAQ content.
Do NOT change the colour system or fonts.
DO rewrite the animation, layout, 3D integration, and parallax systems from scratch.

---

## Architecture: Parallax Layer System

Create a `useParallax(speed: number)` hook using framer-motion `useScroll` + `useTransform`:

```ts
// Reads scrollYProgress [0, 1] and maps to a translateY offset
// speed 0.2 = slow layer, speed 1.0 = normal, speed 2.0 = fast layer
// Use useSpring(raw, { stiffness: 80, damping: 20 }) for buttery lag
```

Create a `useMouseParallax(strength: number)` hook:

```ts
// Tracks mouse position relative to viewport centre
// Returns { x, y } as framer-motion MotionValues with spring easing
// strength 0.02 = subtle, strength 0.08 = dramatic
```

Use these two hooks to drive all 3D scenes and decorative elements throughout.

---

## Section-by-Section Specification

### 1. NAVBAR (fixed, full-width)

- Backdrop: `backdrop-blur-2xl bg-black/40 border-b border-white/5`
- On scroll > 80px: smoothly transition border to `border-white/10`, add subtle bottom glow `box-shadow: 0 1px 0 rgba(74,222,128,0.15)`
- Logo left, links centre, CTA right
- CTA "Get the App": MagneticButton with a living gradient border animation:
  ```css
  @keyframes border-rotate { from { --angle: 0deg } to { --angle: 360deg } }
  border: 1px solid transparent;
  background: conic-gradient(from var(--angle), #4ade80, #38bdf8, #6366f1, #4ade80) border-box;
  ```
- Mobile hamburger: AnimatePresence slide-down drawer with staggered link reveals

---

### 2. HERO SECTION (height: 100vh, overflow hidden)

**Background — 3 parallax depth layers:**
- Layer 0 (fixed): `bg-mesh` blobs — already in index.css, keep as-is
- Layer 1 (speed 0.15): Three large blurred orbs (400px each), emerald top-left, sky bottom-right, indigo centre — move slowly upward as user scrolls
- Layer 2 (speed 0.4): Grid of tiny glowing dots (CSS `radial-gradient` dot pattern), moves faster

**Centre 3D Hero Object — upgrade VisionPrism3D.tsx:**
- Replace the static float with a `useFrame`-driven rotation that responds to `useMouseParallax`
- The prism should rotate ±15° on both X and Y axes following mouse position (spring-eased)
- On scroll: scale 1.0 → 1.6, opacity 1 → 0, translateY 0 → 200px — enhance the spring
- Add a `PointLight` that orbits the prism using `useFrame` at radius 4, speed 0.4 — creates moving caustics

**Typography — stacked parallax layers:**
- "Digital" — Outfit 900, 8rem desktop / 5rem mobile, speed 0.3, enters from opacity 0 + translateY 60 on mount (delay 0.2s)
- "Alchemy" — same size, text-gradient class, speed 0.5, enters with delay 0.4s
- Subtitle — Inter 400, xl, white/50, speed 0.7, delay 0.6s
- These layers scroll at different speeds creating a depth-split effect

**CTA Buttons:**
- "App Store" and "Google Play" — MagneticButton
- Hover shimmer sweep: `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)` animates left-to-right over 0.6s
- Pulsing glow ring under primary button: `box-shadow: 0 0 0 0 rgba(74,222,128,0.4)` → `0 0 0 20px rgba(74,222,128,0)` in a 2s loop

**Scroll Prompt:**
- "Enter The Core" text + chevron icon
- Chevron bounces with `@keyframes bounce-y` (translateY 0 → 10px → 0, 1.5s loop)
- Entire element fades out at scroll > 5%

---

### 3. HORIZONTAL SCROLL FEATURE STRIP (NEW SECTION)

Between hero and solution, add a sticky horizontal scroll panel:

```tsx
// Container: height 400vh, position relative
// Inner: position sticky, top 0, height 100vh, overflow hidden
// Track: translateX driven by scrollYProgress mapped to [0, -300vw]
// Contains 4 feature cards side by side (each 80vw wide)
```

Feature cards (reuse existing copy):
1. "OCR Vision" — icon: ScanLine, stat: 99.9% accuracy
2. "Price Intelligence" — icon: TrendingUp, stat: ₹2Cr+ saved
3. "Split & Settle" — icon: Users, stat: 50K+ households
4. "Pantry Brain" — icon: Receipt, stat: 1M+ items indexed

Each card:
- `.glass-elite` with `border border-white/8`
- Number counter animation when card enters viewport (0 → final value, 1.5s easeOut)
- Icon wrapped in a 3D tilt card (reuse Tilt.tsx)
- Thin gradient progress line at the bottom that fills as the card scrolls into full view

---

### 4. SOLUTION SECTION — 3 Feature Rows

Keep the existing `FeatureRow` structure but enhance each:

**Row 1: Vision Prism Scan — ScannerMockup**
- Phone mockup enters from right: `translateX: 120 → 0, opacity: 0 → 1` via `useInView`
- Scan line sweeping top-to-bottom on 2s loop (already exists — keep it)
- Background: subtle `conic-gradient` spotlight following section scroll progress

**Row 2: Economic Oracle — upgrade SavingsPulse3D.tsx**
- Add a second geometry: `IcosahedronGeometry` orbiting the torusKnot at radius 3 via `useFrame`
- Orbit speed increases on hover (0.3 → 0.8 rad/s)
- Add `Environment preset="city"` for realistic reflections
- Entire Canvas responds to `useMouseParallax` — camera position shifts ±1 unit on both axes

**Row 3: Unified Households — DashboardMockup**
- Phone enters from left: `translateX: -120 → 0`
- Floating notification card slides up from below the phone frame every 4s:
  ```
  "💰 ₹340 saved this week" — glass card, AnimatePresence fade+slideUp, auto-dismisses after 2.5s
  ```

---

### 5. STATS SECTION — Cinematic Counter Row

- Background: `linear-gradient(180deg, transparent, rgba(74,222,128,0.03), transparent)`
- Each stat: on scroll into view, count from 0 to final value using `useMotionValue` + `animate()` with `duration: 2, ease: "easeOut"`
- Stat number uses monospaced font with `fontVariantNumeric: 'tabular-nums'` to prevent layout shift
- Beneath each number: thin mint progress bar animates from 0 → 100% width over 1.5s, staggered at `i * 0.2s` delay

---

### 6. PARALLAX DEPTH STACK (NEW SECTION — between stats and testimonials)

A cinematic "product reveal" moment:

```tsx
// Outer: height 250vh, position relative
// Inner: position sticky, top 0, height 100vh
// 5 absolutely-positioned layers at different scroll speeds:
// Layer 1 (speed 0.1): blurred background gradient blob
// Layer 2 (speed 0.3): app screenshot at 20% opacity, scale 1.1 → 1.0
// Layer 3 (speed 0.5): app screenshot at 60% opacity (main visible phone)
// Layer 4 (speed 0.7): floating UI overlay cards around the phone
// Layer 5 (speed 1.0): foreground text "One scan. Total clarity."
```

Use `MobileFrame` + `DashboardMockup` for layers 2 and 3.
Floating UI cards for layer 4 (glass style):
- Top-left: "₹3,105 saved" with TrendingUp icon
- Top-right: "14 items tracked" with Receipt icon
- Bottom-centre: "AI confidence: 99.2%" with Zap icon

---

### 7. TESTIMONIALS

- Keep the 3-card grid
- Hover: soft emerald glow `box-shadow: 0 0 40px rgba(74,222,128,0.08)`
- Cards stagger in with `delay: i * 0.15s` via `useInView`
- Decorative quote mark `"` in card background at 0.04 opacity (15rem, positioned top-right, slow rotation)

---

### 8. FAQ

- Keep existing toggle behaviour
- Open animation: height 0 → auto via framer-motion `layout` prop + `AnimatePresence`
- Thin mint left border animates from height 0 → full when expanded
- Open item background: `rgba(74,222,128,0.03)` fades in

---

### 9. PRICING

- Keep the 3 tiers
- Middle "Power User" card: always floated `translateY: -8px` with more prominent border glow
- Hover any card: Tilt.tsx applies + spotlight gradient tracks mouse position within the card
- Add "Monthly / Lifetime" toggle at the top — AnimatePresence fades between price values

---

### 10. FOOTER

- Existing structure unchanged
- `scaleX: springScroll` progress bar: replace solid fill with mint-to-sky gradient
- Add `VisionSphere3D` in footer background at 30% opacity, very slow rotation, no interactivity — purely decorative

---

## Global Performance Rules

1. All Three.js canvases: `dpr={[1, 1.5]}` — never exceed 1.5x pixel ratio
2. All `useScroll` transforms: `useSpring` with `{ stiffness: 60, damping: 18, restDelta: 0.001 }`
3. Disable all `useMouseParallax` on touch devices: `window.matchMedia('(pointer: coarse)')`
4. Wrap all Three.js Canvas in `React.Suspense` with a pulsing shimmer fallback
5. `will-change: transform` only on actively animating elements, never globally
6. All `useInView`: `{ once: true, margin: '-10% 0px' }` — trigger slightly before centre

---

## Files to Modify

| File | What to change |
|---|---|
| `src/App.tsx` | Full rewrite of animation system; add horizontal scroll strip, parallax depth stack, enhanced stats counters |
| `src/index.css` | Add `@keyframes border-rotate`, `@keyframes bounce-y`, `@keyframes shimmer-sweep`, `.animated-border` class |
| `src/components/VisionPrism3D.tsx` | Add mouse-parallax rotation + orbiting point light |
| `src/components/SavingsPulse3D.tsx` | Add orbiting icosahedron, `Environment preset="city"`, camera mouse-parallax |
| `src/components/VisionSphere3D.tsx` | Reduce rotation speed for use as low-opacity footer decoration |

Do NOT create new files. Reuse all existing components and utilities.  
Work file by file. After each file, pause and confirm it compiles before moving to the next.  
Start with `src/index.css` (CSS additions only), then `src/App.tsx`, then the three component files.
