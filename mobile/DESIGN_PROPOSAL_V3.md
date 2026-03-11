# PepCheck v3.0 UI/UX Design Proposal

## Executive Summary

This proposal transforms PepCheck from a basic trust-scoring tool into a premium, professional-grade research companion. The new design emphasizes **clarity**, **trust**, and **actionable insights** through careful information hierarchy, modern data visualization, and an intuitive navigation flow.

---

## Design Philosophy

### Core Principles

1. **Trust Through Transparency**: Users are evaluating vendor trustworthiness—our UI must embody that same trustworthiness through clean, professional aesthetics
2. **Progressive Disclosure**: Show summary first, details on demand
3. **Visual Hierarchy**: The most important information (Trust Score, Risk Level) should be instantly scannable
4. **Actionable Insights**: Every screen should tell the user exactly what to do next

### Design Inspiration Sources

- **Robinhood / Revolut**: Clean financial dashboards with prominent metrics and colour-coded indicators
- **Apple Health / Oura Ring**: Health trackers with circular progress indicators and signal breakdowns
- **Trustpilot / Fakespot**: Trust aggregators with score visualization and evidence trails
- **Stripe Dashboard**: Professional data presentation with clear typography hierarchy

---

## Colour System

### Primary Palette (Dark Mode - Default)

| Token | Hex | Usage |
|-------|-----|-------|
| Background Primary | `#0A0A0B` | Main app background |
| Background Secondary | `#141416` | Cards, elevated surfaces |
| Background Tertiary | `#1C1C1F` | Input fields, subtle containers |
| Surface | `#2A2A2E` | Interactive elements, borders |
| Text Primary | `#FFFFFF` | Headlines, key metrics |
| Text Secondary | `#A1A1AA` | Body text, labels |
| Text Tertiary | `#71717A` | Captions, timestamps |

### Semantic Colours

| Token | Hex | Usage |
|-------|-----|-------|
| Trust High | `#10B981` | Scores 60+, positive signals, "Low Risk" |
| Trust Medium | `#F59E0B` | Scores 30-59, "Moderate Risk" |
| Trust Low | `#EF4444` | Scores 0-29, negative signals, "High Risk" |
| Accent | `#6366F1` | Interactive elements, links, focus states |
| Accent Secondary | `#8B5CF6` | Chart accents, brand highlights |

---

## Typography

### Font Family
- **Primary**: SF Pro Display (iOS native) / Inter (Android fallback)
- **Monospace**: SF Mono / JetBrains Mono (for scores, data)

### Scale

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 48px | Bold | 1.1 | Trust Score number |
| Headline 1 | 28px | Semibold | 1.2 | Screen titles |
| Headline 2 | 22px | Semibold | 1.3 | Section headers |
| Body | 16px | Regular | 1.5 | Primary content |
| Caption | 14px | Regular | 1.4 | Secondary info |
| Label | 12px | Medium | 1.3 | Tags, badges |

---

## Navigation Architecture

### Bottom Tab Bar (3 Tabs)

```
┌──────────────────────────────────────────┐
│                                          │
│            [Current Screen]              │
│                                          │
├──────────┬──────────┬──────────┬─────────┤
│   🔍     │    📊    │    📋    │         │
│ Analyse  │  Brands  │  History │         │
└──────────┴──────────┴──────────┴─────────┘
```

- **Analyse**: URL input + results (primary action)
- **Brands**: Brand rankings with bar chart visualization
- **History**: All past analyses with search/filter

---

## Screen Designs

### 1. Analyse Screen (Home)

**Layout:**
```
┌────────────────────────────────────────┐
│  ← PepCheck                      v3.0  │
├────────────────────────────────────────┤
│                                        │
│     🔬 Verify Your Research Source     │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Paste vendor product URL...      │  │
│  │ https://                         │  │
│  └──────────────────────────────────┘  │
│                                        │
│        [ Analyse Vendor ]              │
│                                        │
│  ─────────────────────────────────────  │
│                                        │
│     Recent Analyses (Quick Access)     │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ OP Labs • GHK-Cu        35 pts │    │
│  │ Yesterday • Moderate Risk  →   │    │
│  └────────────────────────────────┘    │
│                                        │
│  ┌────────────────────────────────┐    │
│  │ Peptide Sciences • BPC-157     │    │
│  │ 2 days ago • Low Risk      →   │    │
│  └────────────────────────────────┘    │
│                                        │
└────────────────────────────────────────┘
```

**Key Elements:**
- Prominent URL input with paste-from-clipboard support
- Recent analyses preview (last 3) for quick re-access
- Clean, focused interface—no distractions

---

### 2. Results Screen (Post-Analysis)

**Layout - Two-Tier Information:**

```
┌────────────────────────────────────────┐
│  ←                              Share  │
├────────────────────────────────────────┤
│                                        │
│         ╭────────────────────╮         │
│         │                    │         │
│         │        35          │         │
│         │    TRUST SCORE     │         │
│         │                    │         │
│         ╰────────────────────╯         │
│                                        │
│    ┌─────────────────────────────┐     │
│    │  ⚠️  MODERATE RISK          │     │
│    │  1 red flag detected        │     │
│    └─────────────────────────────┘     │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  Brand: OP Labs                        │
│  Peptide: GHK-Cu                       │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  POSITIVE SIGNALS (5 found)        ✓   │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Batch-specific COA      +20  │→  │
│  ├─────────────────────────────────┤   │
│  │ ✓ HPLC chromatogram       +10  │→  │
│  ├─────────────────────────────────┤   │
│  │ ✓ CAS number provided      +5  │→  │
│  └─────────────────────────────────┘   │
│                                        │
│  RED FLAGS (1 found)               ⚠   │
│  ┌─────────────────────────────────┐   │
│  │ ⚠ Therapeutic claims      -30  │→  │
│  │   "turn my health around"      │   │
│  └─────────────────────────────────┘   │
│                                        │
│       [ Check Another Vendor ]         │
│                                        │
└────────────────────────────────────────┘
```

**Key Design Decisions:**

1. **Trust Score Circle**: Large, prominent, using colour gradient based on score (red→amber→green)
2. **Risk Level Badge**: Clear, non-numeric indicator that's instantly understandable
3. **Signal List**: Tappable rows that expand to show rationale (modal/sheet)
4. **Evidence Snippets**: Brief quotes shown inline for negative signals
5. **Progressive Disclosure**: Tap any signal → full rationale screen

---

### 3. Signal Detail Modal (Metric Deep-Dive)

When user taps a signal:

```
┌────────────────────────────────────────┐
│                         ─────  (drag)  │
├────────────────────────────────────────┤
│                                        │
│  ✓ Batch-Specific Certificate         │
│                           +20 points   │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  WHAT THIS MEANS                       │
│                                        │
│  A batch-specific Certificate of       │
│  Analysis (COA) indicates the vendor   │
│  tests each production batch           │
│  individually, rather than relying on  │
│  a generic sample document.            │
│                                        │
│  WHY IT MATTERS                        │
│                                        │
│  Research-grade peptides require       │
│  batch traceability. This ensures you  │
│  can verify the exact purity and       │
│  identity of the specific product you  │
│  received, not just a representative   │
│  sample from months ago.               │
│                                        │
│  EVIDENCE FOUND                        │
│                                        │
│  "Each vial includes a unique batch    │
│   number with corresponding COA"       │
│                                        │
│           [ Got it ]                   │
│                                        │
└────────────────────────────────────────┘
```

---

### 4. Brand Scores Screen (New Tab)

```
┌────────────────────────────────────────┐
│  Brand Rankings              Sort ↓    │
├────────────────────────────────────────┤
│                                        │
│  Based on 12 analyses across 5 brands  │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  #1  OP Labs                           │
│  ████████████████████████░░░░░  42 avg │
│  6 analyses • GHK-Cu, BPC-157          │
│                                        │
│  #2  Peptide Sciences                  │
│  ██████████████████████░░░░░░░  38 avg │
│  3 analyses • TB-500, Semaglutide      │
│                                        │
│  #3  UK Peptides                       │
│  ████████████████░░░░░░░░░░░░░  28 avg │
│  2 analyses • BPC-157                  │
│                                        │
│  #4  Research Peptides Co              │
│  █████████░░░░░░░░░░░░░░░░░░░░  15 avg │
│  1 analysis • GHK-Cu                   │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  💡 Tip: Analyse more vendors to       │
│     improve your comparison data       │
│                                        │
└────────────────────────────────────────┘
```

**Key Features:**
- Horizontal bar chart for each brand
- Colour-coded bars (green/amber/red based on score)
- Tap a brand → See all analyses for that brand
- Count of analyses and peptides tested shown

---

### 5. History Screen (Redesigned)

```
┌────────────────────────────────────────┐
│  History                       Filter  │
├────────────────────────────────────────┤
│  🔍 Search brands or peptides...       │
├────────────────────────────────────────┤
│                                        │
│  TODAY                                 │
│  ┌─────────────────────────────────┐   │
│  │ OP Labs                         │   │
│  │ GHK-Cu                   35 pts │   │
│  │ 🟡 Moderate Risk        10:32am │   │
│  └─────────────────────────────────┘   │
│                                        │
│  YESTERDAY                             │
│  ┌─────────────────────────────────┐   │
│  │ Peptide Sciences                │   │
│  │ BPC-157                  52 pts │   │
│  │ 🟢 Low Risk              3:15pm │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ TestedPeptides                  │   │
│  │ BPC-157                   0 pts │   │
│  │ 🔴 High Risk             1:45pm │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ───────────────────────────────────── │
│                                        │
│  [ Compare Same Peptide ]              │
│  Select 2+ vendors to compare          │
│                                        │
└────────────────────────────────────────┘
```

**Key Features:**
- Grouped by date (Today, Yesterday, This Week, etc.)
- Search by brand name or peptide name
- Filter by risk level or peptide type
- **Smart Compare**: Only shows comparison option when 2+ analyses exist for same peptide

---

### 6. Comparison Screen (Smart Filtering)

When comparing vendors for the same peptide:

```
┌────────────────────────────────────────┐
│  ←  Comparing BPC-157 Vendors          │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────┬──────────────┐       │
│  │  OP Labs     │   UK Peptides│       │
│  │              │              │       │
│  │     52       │      28      │       │
│  │   🟢 Low     │  🟡 Moderate │       │
│  └──────────────┴──────────────┘       │
│                                        │
│  SIGNAL COMPARISON                     │
│  ─────────────────────────────────────  │
│                                        │
│                    OP Labs  UK Pept.   │
│  ─────────────────────────────────────  │
│  Batch COA         ✓ +20    ✗          │
│  HPLC Data         ✓ +10    ✓ +10      │
│  Third-Party Lab   ✓ +10    ✗          │
│  Purity 99%+       ✓ +5     ✓ +5       │
│  CAS Number        ✓ +5     ✓ +5       │
│  RUO Disclaimer    ✓        ✓          │
│  ─────────────────────────────────────  │
│  RED FLAGS                             │
│  ─────────────────────────────────────  │
│  Therapeutic Claims  ✗       ⚠ -30     │
│  Sells Accessories   ✗       ⚠ -20     │
│  ─────────────────────────────────────  │
│                                        │
│        OP Labs is the safer choice     │
│                                        │
│    [ View OP Labs Details ]            │
│                                        │
└────────────────────────────────────────┘
```

**Smart Comparison Logic:**
- When user selects analyses, filter to show only same-peptide results
- Side-by-side signal comparison with visual checkmarks/warnings
- Clear "winner" recommendation at bottom

---

## Component Library

### Cards
- **Elevation**: Subtle shadow + 1px border (`#2A2A2E`)
- **Border Radius**: 16px for cards, 12px for buttons, 8px for inputs
- **Padding**: 16px internal padding

### Buttons
- **Primary**: `#6366F1` background, white text, full-width
- **Secondary**: Transparent with `#6366F1` border
- **Destructive**: `#EF4444` background

### Score Circle
- SVG-based circular progress indicator
- Animated fill on load
- Gradient stroke: red (0-29) → amber (30-59) → green (60+)

### Risk Badge
- Pill-shaped badge with background colour matching risk level
- Icons: 🟢 Low Risk, 🟡 Moderate Risk, 🔴 High Risk

---

## Animation & Micro-interactions

1. **Score Reveal**: Count-up animation from 0 to final score (500ms)
2. **Risk Badge**: Fade + scale entrance (200ms delay after score)
3. **Signal List**: Staggered fade-in (50ms per item)
4. **Tab Transitions**: Cross-fade (200ms)
5. **Pull-to-Refresh**: Custom refresh indicator on History/Brands
6. **Haptic Feedback**: Light impact on score reveal, button taps

---

## Accessibility

- All touch targets minimum 44×44pt
- Colour-coded elements also have icons/text labels
- VoiceOver labels for all interactive elements
- Supports Dynamic Type (SF Pro scales gracefully)
- High contrast mode support

---

## Implementation Priorities

### Phase 1 (Core)
1. Update types and API service for v3.0 response
2. Redesign Results screen with new Trust Score + Risk Level
3. Implement Signal Detail modal with rationales
4. Update colour system and typography

### Phase 2 (Brand Tracking)
1. AsyncStorage persistence layer
2. Brand Scores screen with bar chart
3. History screen redesign with search/filter

### Phase 3 (Smart Compare)
1. Peptide-filtered comparison
2. Side-by-side signal table
3. Winner recommendation logic

---

## Approval Request

**Joe, please review this design proposal and confirm:**

1. ✅ Colour system and dark theme approach
2. ✅ 3-tab navigation structure (Analyse, Brands, History)
3. ✅ Trust Score circle + Risk Badge as primary result display
4. ✅ Signal Detail modal for metric deep-dives
5. ✅ Brand bar chart visualization
6. ✅ Smart peptide-filtered comparison

Reply with approval to proceed with implementation, or provide feedback on any elements you'd like changed.
