# Nightshift Landing MVP — Custom CSS / Non‑EUI Patterns

Audit for design review with Kate. Covers custom sizing, animations, hover/active styles, and markup that goes beyond standard EUI props or primitives.

**Branch:** `nightshift-flyouts-pr4` · **PR:** [#279790](https://github.com/elastic/kibana/pull/279790)

Screenshots captured from local Kibana (`http://localhost:5601/vth/app/observability/nightshift`) via Playwright.

---

## Quick reference

| # | Component | Surface | Custom because | EUI gap / suggestion |
|---|-----------|---------|----------------|----------------------|
| 1 | Hero gradient icon | Landing | Custom `<div>` + linear-gradient circle | No EUI “product mark in gradient orb” primitive → `EuiAvatar` + token gradient, or shared Nightshift icon package |
| 2 | Hero title typography | Landing | Overrides `EuiTitle` font-size/weight/nowrap | Use `EuiTitle size="m"` + theme tokens only; avoid calc overrides |
| 3 | Nightshift mark SVG | Landing + flyouts | Custom inline SVG, not `EuiIcon` | Add to `@elastic/eui` icon set or `@kbn/shared-ux` if reused |
| 4 | Status summary cards | Landing | Custom hover shadow, focus ring, count `<span>` sizing | `EuiPanel` + `euiShadowHover` is OK; count could be `EuiTitle size="s"` |
| 5 | Blast radius filter chips | Landing | Native `<button>` + full Emotion styling | `EuiFilterButton` / `EuiBadgeGroup` with `toggleGroup` pattern |
| 6 | Event list row | Landing | `<div role="button">`, custom hover bg, nested chat btn | `EuiListGroup` / `EuiSelectable` with `renderItem` + separate action column |
| 7 | Severity status dot | Landing | Nested `<span>` circles | `EuiHealth` or `EuiIcon` `dot` with `color` prop |
| 8 | Investigating / Investigated badge | Landing + flyouts | `@keyframes` dots + AI gradient badge | Typing indicator: EUI loading pattern; Investigated: `@kbn/shared-ux-ai-components` (intentional) |
| 9 | Row “Open in chat” icon | Landing | `AiButtonIcon` + `!important` color/bg overrides | Extend `AiButtonIcon` with `color="text"` / `display="empty"` variant in shared-ux |
| 10 | Page width | Landing | `restrictWidth="900px"` fixed px | `maxWidth` token or EUI page template size preset |
| 11 | Transition helpers | Shared | Custom transition strings + reduced-motion | Prefer `euiTheme.animation.*` via Emotion `css` mixin in EUI docs |
| 12 | Detection card row | Event flyout | `<div role="button">` + hover | Same as #6 — `EuiListGroupItem` |
| 13 | Entity chip | Detection flyout | Native `<button>` pill | `EuiBadge` with `onClickAriaLabel` or `EuiButtonEmpty` `size="s"` |
| 14 | Hover-reveal chat actions | Investigation UI | `opacity: 0 → 1` on `:hover`/`:focus-within` | `EuiListGroupItem` `extraAction` always visible, or EUI `showActionOnHover` if added |
| 15 | Plain flyout footers | All flyouts | Overrides default shaded footer | Confirm with EUI if plain footer is a supported `EuiFlyoutFooter` variant |
| 16 | Fixed 14px flyout body | Investigation flyout | Hard-coded `14px` font size | `EuiText size="s"` (14px in Amsterdam) — drop custom constant |
| 17 | Sparkline / trend charts | Detection flyout | `@elastic/charts`, fixed 64×32 / 160px | Charts are expected; document as non-EUI dependency |

---

## 1. Hero gradient icon badge

**Description:** Circular gradient background behind the Nightshift product mark in the page hero. Not an `EuiAvatar`, `EuiIcon`, or `EuiPanel`.

**File:** `app/nightshift_header.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/01-landing-full.png` (top-left)

```tsx
<div
  role="img"
  css={css`
    background: linear-gradient(
      99.4deg,
      ${euiTheme.colors.backgroundLightPrimary} 3.97%,
      ${euiTheme.colors.backgroundLightAccent} 65.6%
    );
    border-radius: 50%;
    height: calc(${euiTheme.size.xxl} + ${euiTheme.size.m});
    width: calc(${euiTheme.size.xxl} + ${euiTheme.size.m});
  `}
>
  <NightshiftMarkIcon />
</div>
```

**EUI suggestion:** Wrap in `EuiAvatar` with `color="plain"` and gradient via theme, or extract a shared `NightshiftHeroIcon` in design system. Avoid raw `<div role="img">` if an avatar pattern exists.

---

## 2. Hero title typography overrides

**Description:** Hero headline uses calc-based font size, medium weight, fixed line-height, and `white-space: nowrap` on top of `EuiTitle size="m"`.

**File:** `app/nightshift_header.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/01-landing-full.png`

```tsx
<EuiTitle
  size="m"
  css={css`
    font-size: calc(${euiTheme.size.l} + ${euiTheme.size.xxs});
    font-weight: ${euiTheme.font.weight.medium};
    line-height: ${euiTheme.size.xl};
    white-space: nowrap;
  `}
>
  <h1>{title}</h1>
</EuiTitle>
```

**EUI suggestion:** Use `EuiTitle size="m"` without overrides, or `size="l"` if design needs larger type. Drop `nowrap` unless required for layout — it hurts i18n/long strings.

---

## 3. NightshiftMarkIcon (custom SVG)

**Description:** Product mark rendered as inline SVG with configurable px size (default 20). Used in hero and “Significant Event” flyout badge.

**File:** `app/nightshift_mark_icon.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/06-event-flyout.png` (Significant Event badge)

```tsx
<svg
  width={size}
  height={Math.round(size * 0.95)}
  viewBox="0 0 20 19"
  css={css`
    display: ${inline ? 'inline-block' : 'block'};
    vertical-align: ${inline ? 'middle' : 'initial'};
  `}
>
  <path d="M19.4936 6.75C..." fill="currentColor" />
</svg>
```

**EUI suggestion:** Register as custom `EuiIcon` type or ship in `@kbn/shared-ux` icon bundle so consumers use `<EuiIcon type="logoNightshift" />`.

---

## 4. Status summary cards (clickable panels)

**Description:** Need action / Resolved cards are `EuiPanel` with custom border, no default shadow, hover/focus shadow via `euiShadowHover`, explicit `transform: none`, custom focus-visible outline, and oversized count in a plain `<span>`.

**File:** `landing/significant_event_statuses.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/01-landing-full.png` (cards below hero)

```tsx
<EuiPanel
  css={css`
    border: ${euiTheme.border.thin};
    border-radius: ${euiTheme.size.s};
    &&:hover, &&:focus {
      ${euiShadowHover(euiThemeContext, 's')}
    }
    &&:focus-visible {
      outline: ${euiTheme.border.width.thick} solid ${euiTheme.colors.primary};
    }
  `}
  role="button"
>
  <span css={css`
    font-size: calc(${euiTheme.size.xl} - ${euiTheme.size.xs});
    height: ${euiTheme.size.xl};
  `}>{count}</span>
</EuiPanel>
```

**EUI suggestion:** Consider `EuiCard` `selectable` + `layout="horizontal"` if available, or document this as an approved Nightshift card pattern. Replace count `<span>` with `EuiTitle size="s"`.

---

## 5. Blast radius filter chips

**Description:** Filter pills are native `<button>` elements with custom danger selected state, pill radius, fixed height (`xl`), hover border/background, and nested `EuiBadge` with `.euiBadge__content` override.

**File:** `landing/blast_radius_entities.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/03-blast-radius-chips.png`

```tsx
<button
  aria-pressed={isSelected}
  css={css`
    background: ${isSelected ? euiTheme.colors.backgroundBaseDanger : ...};
    border-radius: ${euiTheme.size.base};
    height: ${euiTheme.size.xl};
    &:hover { ... }
    &:focus-visible { outline: ... }
  `}
>
  <EuiText size="xs">{name}</EuiText>
  <EuiBadge color="danger">{count}</EuiBadge>
</button>
```

**EUI suggestion:** `EuiFilterButton` with `hasActiveFilters` / `numFilters` for count badge, or `EuiBadgeGroup` + `EuiButtonGroup` `legend="Blast radius"`. Reduces bespoke focus/hover logic.

---

## 6. Significant event list row

**Description:** Entire row is a `<div role="button">` (not `EuiListGroupItem`) because it nests an interactive chat button. Custom selected/hover backgrounds via `nightshiftBackgroundTransition`.

**File:** `landing/significant_event_item.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/04-event-list-row.png` · hover: `05-event-list-row-hover.png`

```tsx
<div
  role="button"
  tabIndex={0}
  css={css`
    background: ${isSelected ? euiTheme.colors.backgroundBaseInteractiveSelect : ...};
    transition: ${nightshiftBackgroundTransition(euiTheme)};
    &:hover { background: ...; }
  `}
>
  <InvestigationStatusBadge event={event} />
  <AiButtonIcon css={css`&& { color: ... !important; }`} />
</div>
```

**EUI suggestion:** `EuiListGroupItem` with `extraAction` for chat (stops row click propagation), or `EuiSelectable`/`EuiBasicTable` row actions pattern from Observability apps.

---

## 7. Severity status dot

**Description:** Colored circle beside title/summary built from nested `<span>` elements with calc sizes — not `EuiHealth`.

**File:** `landing/significant_event_item.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/04-event-list-row.png` (left of title)

```tsx
<span css={css`
  background: ${statusDotColor};
  border-radius: 50%;
  height: calc(${euiTheme.size.xs} + ${euiTheme.size.xxs});
  width: calc(${euiTheme.size.xs} + ${euiTheme.size.xxs});
`} />
```

**EUI suggestion:** `<EuiHealth color={statusColor === 'success' ? 'success' : 'danger'} />` or `<EuiIcon type="dot" color={...} />`.

---

## 8. Investigating / Investigated status badge

**Description:** Most visible custom animation in MVP. **Investigating:** three dots with staggered `@keyframes` pulse. **Investigated:** AI gradient outline badge + gradient check icon from `@kbn/shared-ux-ai-components`.

**File:** `investigation/investigation_status_badge.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/04-event-list-row.png` (top-left badge)

```tsx
const investigatingDotAnimation = keyframes`
  0%, 80%, 100% { opacity: 0.35; transform: scale(0.75); }
  40% { opacity: 1; transform: scale(1); }
`;

<span css={css`
  animation: ${investigatingDotAnimation} 1.4s ... infinite;
  background: ${euiTheme.colors.mediumShade};
  border-radius: 50%;
  height: ${euiTheme.size.xs};
`} />

// Investigated:
<EuiBadge css={css`
  background: linear-gradient(...) padding-box, ${borderGradient} border-box;
  border: thin solid transparent;
`} />
```

**EUI suggestion:** Investigating dots — align with Agent Builder / AI loading patterns in shared-ux. Investigated gradient — keep shared-ux AI badge; request EUI token for “AI success outline badge” if this spreads.

---

## 9. Row “Open in chat” (`AiButtonIcon` overrides)

**Description:** Ghost chat control on each event row uses `!important` to force subdued color and transparent background when not hovered.

**File:** `landing/significant_event_item.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/04-event-list-row.png` (top-right)

```tsx
<AiButtonIcon
  variant="empty"
  css={css`
    && { color: ${euiTheme.colors.textSubdued} !important; }
    &&:not(:hover):not(:focus-visible) {
      background: transparent !important;
    }
  `}
/>
```

**EUI suggestion:** Add `color="text"` / `display="subdued"` to `AiButtonIcon` API instead of per-page overrides.

---

## 10. Page width constraint

**Description:** Landing constrained to fixed **900px** width.

**File:** `nightshift.tsx`

**Screenshot:** `nightshift_eui_audit_screenshots/01-landing-full.png`

```tsx
<ObservabilityPageTemplate restrictWidth="900px" ... />
```

**EUI suggestion:** Use page template `restrictWidth={false}` + `EuiPage` `paddingSize="l"` with `maxWidth` from theme, or define a Nightshift layout token in Observability.

---

## 11. Shared transition system

**Description:** Centralized custom transition strings (background, opacity, transform, box-shadow) and `prefers-reduced-motion` guard used across landing and flyouts.

**File:** `common/nightshift_transition.ts`

```tsx
export const nightshiftBackgroundTransition = (euiTheme) =>
  `background ${euiTheme.animation.normal} ${euiTheme.animation.resistance}`;

export const nightshiftReducedMotionStyles = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;
```

**EUI suggestion:** Good pattern — consider contributing a small `@kbn/shared-ux` hook `useReducedMotionStyles()` if reused outside Nightshift.

---

## Flyout patterns (same PR, for completeness)

### 12. Detection card row — `event/detections_list.tsx`

`<div role="button">` + hover background (same pattern as #6). Screenshot: `06-event-flyout.png`.

**Suggestion:** `EuiListGroupItem` with leading sparkline slot.

### 13. Entity chip — `entity/entity_chip.tsx`

Native `<button>` pill with arrow icon. **Suggestion:** `EuiBadge` `onClick` + `iconType="arrowRight"` or `EuiButtonEmpty size="xs"`.

### 14. Hover-reveal chat actions — `investigation/investigation_summary_card.tsx`, `investigation/investigation_flyout.tsx`

Secondary chat buttons hidden (`opacity: 0`) until row/panel hover or focus-within. Screenshot: `07-investigation-summary.png`.

```tsx
css`
  opacity: 0;
  transition: ${nightshiftOpacityTransition(euiTheme)};
  &:hover .${actionClass} { opacity: 1; }
`
```

**Suggestion:** Always show icon buttons (`EuiButtonIcon`) for a11y, or use EUI `showOnHover` if/design adds it.

### 15. Plain flyout footers — all flyouts

Override shaded footer: `background: plain` + top border only.

**Suggestion:** Confirm with EUI team whether `EuiFlyoutFooter` should expose `color="plain"` / `hasBorder`.

### 16. Investigation flyout 14px body — `investigation/investigation_flyout.tsx`

`INVESTIGATION_FLYOUT_BODY_FONT_SIZE = '14px'` applied via wrapper div.

**Suggestion:** Use `EuiText size="s"` consistently; remove hard-coded px.

### 17. Change-point charts — `detection/change_point_visualization.tsx`

`@elastic/charts` sparklines (64×32) and trend chart (160px height). Not EUI — expected for metrics visualization.

---

## Patterns to discuss with Kate

**Likely keep (design-specific / shared-ux):**
- AI gradient Investigated badge and check icons
- Investigating three-dot animation (if no shared AI loading badge yet)
- NightshiftMarkIcon (until in icon library)
- Hero gradient orb (brand moment)

**Good candidates to replace with EUI:**
- Blast radius native `<button>` chips → filter button group
- Event/detection `<div role="button">` rows → list group / selectable
- Severity dot → `EuiHealth`
- Hero title calc overrides → standard `EuiTitle` sizes
- `!important` on `AiButtonIcon` → shared-ux variant prop
- Fixed 900px / 14px / 220px → theme tokens

**Accessibility notes for review:**
- Hover-only visible actions fail WCAG unless keyboard `:focus-within` works (we added focus-within; still discuss always-visible vs hover)
- Nested interactive controls in event rows required custom keyboard handling

---

## Screenshot index

| File | Shows |
|------|-------|
| `01-landing-full.png` | Full landing: hero, status cards, blast radius, event lists |
| `03-blast-radius-chips.png` | Blast radius filter chip row |
| `04-event-list-row.png` | Event row: Investigating badge, chat icon, severity dot |
| `05-event-list-row-hover.png` | Event row hover state |
| `06-event-flyout.png` | Significant event flyout header + detections |
| `07-investigation-summary.png` | Investigation summary / Try next / blind spots in event flyout |

Captured with Playwright against local seeded data. Re-run from repo root:

```bash
node scripts/playwright_screenshot_nightshift.js  # or reuse the inline script in this PR branch
```
