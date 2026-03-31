# Design guidelines — Voter Management Portal

This document is the **source of truth** for visual and UX patterns. Extend the system here before introducing one-off colors or copy styles.

**Code anchors**

- Palette and status tokens: [`web/lib/colors.ts`](../web/lib/colors.ts)
- Voter list row logic and legend order: [`web/lib/voterProfileCompleteness.ts`](../web/lib/voterProfileCompleteness.ts)
- Global typography, cards, buttons: [`web/styles/globals.css`](../web/styles/globals.css)
- App shell (sidebar, sticky header): [`web/components/DashboardLayout.tsx`](../web/components/DashboardLayout.tsx)
- Example dense table + row styling: [`web/pages/voters.tsx`](../web/pages/voters.tsx)

---

## 1. Principles

### Bilingual UX

- Prefer **English / मराठी** in the same label or line when space allows (forms, table headers, buttons).
- Section titles often use **Marathi first** then English (`वैयक्तिक माहिती / Personal`) where that matches existing screens.
- Keep strings consistent with existing pages; add new pairs in both languages when adding UI.

### Tone and density

- Aim for a **records / administration** feel: calm backgrounds, clear hierarchy, readable tables.
- Use **strong color** mainly for **primary actions** and **status** (workflow state, validation, alerts)—not for decorative variety.

### Single source of truth for color

- Import [`colors`](../web/lib/colors.ts) and existing `*_CONFIG` exports for badges, borders, and backgrounds.
- **Do not** paste new hex values into page-level inline styles unless you are prototyping—and then **promote** them into `colors.ts` before merge.

---

## 2. Color system

### Core tokens (`colors`)

| Role | Token | Typical use |
|------|--------|-------------|
| Primary | `primary`, `primaryHover`, `primaryLight`, `primaryBorderLight` | Sidebar, links, CTAs, light primary panels and borders |
| Accent | `accent`, `accentHover`, `accentLight` | Secondary brand actions (`btn-accent`) |
| Surfaces | `pageBg`, `surface`, `borderLight` | Page background, cards, dividers |
| Text | `textPrimary`, `textHeading`, `textSecondary`, `textMuted`, `textSubtle`, `textDisabled`, `textOnPrimary` | Body (`textPrimary`), page titles and emphasized labels (`textHeading`), captions (`textMuted` / `textSubtle`) |
| Semantic | `success`, `warning`, `error` | Alerts, destructive emphasis—use sparingly |

**Product note (encoded in code):** primary is **Congress blue**; **saffron / orange** is intentionally avoided for brand alignment.

### Service request statuses (`SR_STATUS_CONFIG`)

Use for service-request badges, filters, and timeline chips. Keys are **full status strings** (e.g. `Document Submitted`). Each entry defines `color`, `bg`, and `border` for a consistent pill style.

### Voter list row categories (`VOTER_LIST_ROW`)

Used on the voters list for **row background**, **left border** (4px), and **hover** tint. Each category includes `labelEn` and `labelMr` for the legend and tooltips.

- **Visual signal:** border color is the main discriminator; background stays low saturation.
- **Pills:** record summary uses the same category via [`getVoterListRecordPill`](../web/lib/voterProfileCompleteness.ts); tooltips should explain missing fields where relevant.

**Legend order** is fixed in `VOTER_LIST_LEGEND_ORDER` in [`voterProfileCompleteness.ts`](../web/lib/voterProfileCompleteness.ts)—keep new categories aligned with that ordering when you extend the list.

### Electoral / profile status (`VOTER_STATUS_CONFIG`)

Maps voter **status** values (e.g. `Active`, `मयत`) to badge `bg` + `color`. Use for status badges on profile and tables, not for arbitrary labels.

---

## 3. Typography

### Latin / default UI

- **Body:** system stack with Devanagari-capable fallbacks (see `body` in [`globals.css`](../web/styles/globals.css)); base size **15px**, line-height **1.5**.
- **Emphasized headings** in app content (h1/h2-style): prefer `colors.textHeading` from [`colors.ts`](../web/lib/colors.ts) instead of hard-coded slate hex.
- **Mobile:** inputs and controls **16px** minimum to reduce iOS zoom.

### Devanagari (Marathi)

- For Marathi **names** in tables, the app often uses **`fontFamily: 'serif'`** on the cell (see voters table)—improves readability for continuous Devanagari.
- Fonts such as **Noto Sans Devanagari** and **Anek Devanagari** are available via [`web/package.json`](../web/package.json) / `postinstall` font copies; prefer reusing these over random webfonts.

### Hierarchy

- Page titles inside content: typically **20–28px**, bold, `colors.textPrimary` or `#0f172a` where cards need extra contrast (existing voter profile).
- Table headers: smaller, uppercase or semi-bold, muted color—mirror [`web/pages/voters.tsx`](../web/pages/voters.tsx).

---

## 4. Layout and structure

### App shell

- **Sidebar:** fixed **240px**, primary background (`colors.primary`).
- **Main column:** `margin-left: 240px` on desktop; `maxWidth` ~**1400px** for content area in layout.
- **Sticky header:** bar under the top uses `colors.surface`, light border/shadow—shows **page title** (EN + MR) and date strip.

### Cards

- Use **`className="card"`** from [`globals.css`](../web/styles/globals.css): white surface, **12px** radius, **24px** padding, light border and shadow.

### Spacing rhythm

- Common gaps: **8, 12, 16, 20, 24px** between blocks; keep adjacent sections visually grouped.

---

## 5. Components and patterns

### Buttons

- **Primary:** `.btn-primary` — main actions (Congress blue).
- **Secondary:** `.btn-secondary` — cancel / low emphasis.
- **Accent:** `.btn-accent` — teal, for distinct positive secondary flows.

### Badges and pills

- Derive colors from `colors`, `SR_STATUS_CONFIG`, `VOTER_STATUS_CONFIG`, or `VOTER_LIST_ROW`—not new hex per screen.
- Keep **padding** and **border-radius** consistent with existing badges (~rounded 6–12px).

### Tables

- Sortable headers: indicate active column; use subtle hover on rows.
- Long text: **truncate** with `textOverflow: ellipsis` and a **`title`** (tooltip) with full value (voters list pattern).
- Row click targets: pointer cursor + clear hover background (respect `getVoterListRowStyle` for voter rows).

---

## 6. Accessibility and data density

- **Color alone is not enough** for meaning: voter list provides a **legend** and **pill tooltips**—preserve that when adding states.
- Prefer **contrast** that passes WCAG for text on `surface` and on primary buttons (`textOnPrimary`).
- On **tinted row backgrounds**, rely on **dark border** + **dark text** for labels; avoid low-contrast gray on colored rows.

---

## 7. How to add a new status or voter row category

1. **Colors:** add tokens or a new key in [`web/lib/colors.ts`](../web/lib/colors.ts) (`VOTER_LIST_ROW`, `SR_STATUS_CONFIG`, or `VOTER_STATUS_CONFIG` as appropriate) with `labelEn` / `labelMr` where the pattern already exists.
2. **Types:** export/update types (`VoterListRowCategory`, etc.).
3. **Logic:** update [`voterProfileCompleteness.ts`](../web/lib/voterProfileCompleteness.ts) (classification, legend order, tooltips).
4. **API/UI:** extend selects/flatten in API if new fields drive the rule; wire legend and row style on [`web/pages/voters.tsx`](../web/pages/voters.tsx) (or shared helper).

---

## 8. Out of scope (future)

- Full design system in Figma
- Dark mode
- Global redesign or token rename migration

---

## Quick checklist before merge (UI changes)

- [ ] No stray hex—new colors from `colors.ts` or justified and then promoted.
- [ ] Bilingual strings for user-visible labels where siblings use EN+MR.
- [ ] Status / row meaning documented in legend or tooltip if color is new.
- [ ] Tables: truncation + `title` for ellipsized cells.
