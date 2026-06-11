# Xbox VS Code Theme — Remaining Work

> **Status (v0.4.0):** Phases 1–3 of the original modernization plan are complete on branch `modernize/phase-1-2`. A first color experiment round (Tier 1 brand markers + tab/list polish + title bar legibility) is complete on branch `color/tier-1`. This document tracks **only what's left**.
>
> See `CHANGELOG.md` for what shipped, and commit `5525003` for the original full plan if you need historical context.

---

## 1. Phase 4 — Publish & accessibility

The build pipeline (`npm run build` / `validate` / `test`) and CI workflow (`.github/workflows/ci.yml`) are in place, but publishing is still manual.

### 1.1 High-Contrast variants

Marketplace recommends shipping HC variants for accessibility. Trivial now that Phase 3 introduced a generator.

- [ ] Add `src/palette.json` entries `hcDark` and `hcLight` (saturated palette, mostly pure white/black + Xbox green + pure primaries)
- [ ] Create `src/themes/hc-dark.json` and `src/themes/hc-light.json` (start by copying dark/light, then bump contrast)
- [ ] Update `scripts/build-themes.mjs` to iterate over all palettes, not just `dark`/`light`
- [ ] Register both in `package.json` `contributes.themes` with `uiTheme: "hc-black"` / `"hc-light"`
- [ ] Add HC screenshots to `images/` and README

### 1.2 Marketplace publish workflow

- [ ] `.github/workflows/release.yml` triggered by `release: published`
  - Runs `npm run test`
  - Runs `npm run package` (creates `.vsix`)
  - Runs `npm run publish:vsce` (uses `VSCE_PAT` secret)
  - Runs `npm run publish:ovsx` (uses `OVSX_PAT` secret) — Open VSX for VSCodium/Cursor users
  - Attaches `.vsix` to the GitHub Release
- [ ] Add `VSCE_PAT` and `OVSX_PAT` to repo secrets (manual step)
- [ ] First release: bump version to **`1.0.0`** to signal stability

### 1.3 Repo hygiene

- [ ] Issue templates (`.github/ISSUE_TEMPLATE/{bug.yml,enhancement.yml}`)
- [ ] PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Add a `LICENSE` clarification / attribution note for any externally-derived palette work (see § 4 below)

---

## 2. Light theme palette overhaul

The build pipeline reports light is only **~60% tokenized** vs dark's 91% — many bespoke hex values remain inline because the original light theme used VS Code default-light colors that don't fit the dark palette roles.

- [ ] Expand `src/palette.json` `light` block with roles needed for currently-literal values (e.g. button hover blues, soft selection grays, focus tints)
- [ ] Replace literal hexes in `src/themes/xbox360.json` with `$role` tokens
- [ ] Target: ≥ 90% tokenized (parity with dark)
- [ ] As part of this, audit light theme syntax colors against a real VS Code light reference (the current light is "dark theme inverted" not "designed light")

---

## 3. Deferred color experiments (post-v0.4.0)

Prototyped on branch `color/tier-1` but not adopted.

### 3.1 Tier 3 — list / selection foreground accents

Foreground-only changes (no background changes = contrast stays safe). Highest-impact surface is the command palette.

Keys to flip (dark):

```jsonc
"list.activeSelectionForeground":  "$greenNeon",   // currently $fg
"list.focusForeground":            "$greenNeon",   // currently $fg
"list.highlightForeground":        "$greenNeon",   // matched substring in filter
"quickInputList.focusForeground":  "$greenNeon",
"menubar.selectionForeground":     "$greenNeon",   // currently $fgDim
"pickerGroup.foreground":          "$green"        // section headers in cmd palette
```

Light theme: mirror with `$green` (saturated) instead of `$greenNeon` (which is muted in the light palette).

**Risk:** Medium — touches the most-used UI surface. Recommend living with it for a week before merging permanently.

### 3.2 Tier 4 cursor (low-risk if isolated)

```jsonc
"editorCursor.foreground":   "$greenNeon",
"terminalCursor.foreground": "$greenNeon"
```

Some users find a green cursor harder to track than white. Apply alone before deciding.

### 3.3 Tier 4 selection background (blocked on color choice)

A 12-variant experiment proved that an obvious `$green` wash fails: selecting any green-toned syntax (functions, comments, yellow-green strings) washes out. Top candidates surfaced:

| Variant | Hex | Rationale |
|---|---|---|
| **Orange wash** | `#e3641a4d` (30% `$orange`) | Xbox-brand-adjacent (parameter terracotta); orange is rare in syntax → never overlaps; warm + distinctive |
| **Purple wash** | `#ae81ff40` (25% `$purple`) | Complementary to green = high contrast; classic dark-theme selection; minor overlap with numerics |
| **Green outline** | `#107c1026` bg + 1px `$greenNeon` outline | Brand-committed with a sharp edge defining the selection boundary |

When revisiting:
- Pair `editor.selectionHighlightBackground` at ~50% of the primary alpha (same-word highlight)
- Also update `editor.wordHighlightBackground`, `editor.wordHighlightStrongBackground`, `editor.findMatchHighlightBackground` in the same hue family for consistency
- Test on TypeScript (cyan types), Markdown (green/yellow), JSON (lots of strings) before committing

### 3.4 Items explicitly rejected this round

| Key | Rejected reason |
|---|---|
| `titleBar.border` (green hairline) | Visual noise; the green status bar is sufficient brand marker |
| `breadcrumb.focusForeground` → `$greenNeon` | Not impactful enough to justify |
| `tab.activeBorderTop` → `$green` | Two-tone (dark top + neon bottom) was distracting — see commit `cde2f9e` |

---

## 4. Open questions

- [ ] **Attribution.** Review whether any externally-derived palette work in the theme warrants explicit credit in the README or `LICENSE` before publishing v1.0.0.
- [ ] **Open VSX publishing.** Worth the extra workflow step + secret to reach VSCodium / Cursor / Gitpod users? (Recommendation: yes — Open VSX install is ~free, audience is non-trivial.)
- [ ] **Marketing.** r/vscode "I made a thing" post + refresh Marketplace description text when v1.0.0 lands.

---

## 5. Provenance

Original plan derived from three independent AI model reviews (Claude Opus 4.7, GPT-5.5, Gemini 3.1 Pro) of the repository at version 0.3.8. Full individual plans archived in the session artifacts folder:

- `~/.copilot/session-state/<session>/files/plan-claude-opus.md`
- `~/.copilot/session-state/<session>/files/plan-gpt5.md`
- `~/.copilot/session-state/<session>/files/plan-gemini.md`

The synthesized master plan (everything in §§ 1–6 of the original document) was implemented in commit `5525003` ("Phase 1–3 modernization") and `c9a37b6` (extended color coverage + bug fixes). This trimmed document tracks only the work that remains.
