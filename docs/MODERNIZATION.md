# Xbox VS Code Theme — Remaining Work

> **Status (v0.7.1):** Phases 1–3 of the original modernization plan are complete, plus the v0.7.0 theme expansion (XBOX Original 2001 + High Contrast Dark/Light) and accessibility fixes are shipped. A bundled **XBOX Icons** file icon theme (from the MIT-licensed [vscode-icons](https://github.com/vscode-icons/vscode-icons) project) has been added. This document tracks **only what's left**.
>
> See `CHANGELOG.md` for what shipped, and commit `5525003` for the original full plan if you need historical context.

---

## 1. Phase 4 — Publish automation

The build pipeline (`npm run build` / `validate` / `test`) and CI workflow (`.github/workflows/ci.yml`) are in place, and the High-Contrast accessibility variants shipped in v0.7.0 (see §1.1). Publishing is still manual.

### 1.1 High-Contrast variants — ✅ done (v0.7.0)

Shipped via the `extends` generator added to `scripts/build-themes.mjs`.

- [x] Add `src/palette.json` entries `hcDark` and `hcLight` (accessible green `#2ecc40` ~9.8:1, pure white/black + contrast borders)
- [x] Create `src/themes/hcDark.json` (`extends: "one"`) and `src/themes/hcLight.json` (`extends: "xbox360"`)
- [x] `scripts/build-themes.mjs` iterates over all palettes via the `VARIANTS` array
- [x] Registered in `package.json` `contributes.themes` with `uiTheme: "hc-black"` / `"hc-light"`
- [x] HC screenshots added to `images/` and README

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
- [x] `LICENSE` clarification / attribution note for externally-derived assets — see `THIRD-PARTY-NOTICES.md` (covers the bundled vscode-icons file icons)

---

## 1.5 File icon theme — ✅ added (unreleased)

A bundled **XBOX Icons** file icon theme pairs with the color themes.

- [x] `fileicons/icons/` — full vscode-icons SVG set (v12.18.0)
- [x] `fileicons/xbox-icon-theme.json` — full mapping (1,336 icon definitions) derived from vscode-icons' generated theme, with `iconPath` rewritten to `./icons/` and empty light-default slots backfilled
- [x] Registered in `package.json` `contributes.iconThemes` (id `xbox-icons`, label `XBOX Icons`)
- [x] MIT attribution in `THIRD-PARTY-NOTICES.md` + README
- [x] Reproducible re-vendoring via `npm run build:icons` (`scripts/build-icon-theme.mjs`) — downloads the pinned vscode-icons version, rewrites paths, backfills light defaults; output is byte-identical and validated by `npm run validate`
- [ ] Ship in a future release (CHANGELOG + version bump + publish) — note the VSIX grows ~8 MB from the bundled SVGs

---

## 1.6 Theme preview generator — ✅ added (unreleased)

A deterministic screenshot generator renders every variant + an icon
before/after for quick visual review (e.g. after a palette change).

- [x] `scripts/screenshots.mjs` + `npm run screenshots` — headless Chromium (Playwright) renders a realistic VS Code workbench mock (activity bar + badge, explorer with file icons, tabs, breadcrumbs, active-line highlight, minimap, panel, full status bar), with chrome colored straight from each built `themes/*.json` `colors` map and code highlighted by Shiki (which consumes the theme JSON natively)
- [x] Also emits a **palette swatch sheet** per variant (`images/<theme>-palette.png`) showing every named `src/palette.json` role as a chip + hex (alpha shown over a checkerboard), so the full color configuration is reviewable at a glance — surfaced in the README under a collapsible per theme
- [x] Outputs fixed-size PNGs straight into `images/` using the README naming (`xbox-360.png`, `xbox-360-palette.png`, `icons-before/after.png`; 1240×780 logical @2× workbench; full-width palette sheet; 340×520 icon before/after using the bundled `fileicons/` SVGs) — identical framing/sizing every run, unlike the old manual captures, and consumed directly by `README.md`
- [x] `images/*.png` are VSIX-excluded (only `xbox-logo.png` ships, since README embeds via raw.githubusercontent URLs); `playwright`/`shiki` are devDependencies only (not shipped)
- [ ] Optional: run in CI to verify the committed `images/` are regenerable and in sync. Note these are a reproducible *mock*, not pixel-identical to a real VS Code capture.

---

## 2. Light theme palette overhaul

The original light theme used VS Code default-light colors that don't fit the dark palette roles, so it carried ~263 bespoke inline hexes (~64% tokenized vs dark's 91%).

- [x] Expand `src/palette.json` `xbox360` block with roles for every currently-literal value (neutrals/borders, diagnostics, git/diff, merge, terminal ANSI, symbol icons, selection/hover tints). Mirrored into the `hcLight` block, which inherits xbox360 via `extends`.
- [x] Replace literal hexes in `src/themes/xbox360.json` with `$role` tokens — **263 keys tokenized**.
- [x] Target reached: **xbox360 and hcLight are now 100% tokenized** (0 literals). This was a pure, byte-identical refactor — each new role holds the exact original hex, so built `themes/*.json` are unchanged.
- [ ] Future (visual): audit light theme syntax/chrome colors against a real VS Code light reference (the current light is "dark theme inverted" not "designed light"); the new named roles make a rebrand a palette-only edit.

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

- [x] **Attribution.** Externally-derived assets are now credited in `THIRD-PARTY-NOTICES.md` (bundled vscode-icons file icons, MIT) and referenced from the README. Revisit if more third-party work is added.
- [ ] **Open VSX publishing.** Worth the extra workflow step + secret to reach VSCodium / Cursor / Gitpod users? (Recommendation: yes — Open VSX install is ~free, audience is non-trivial.)
- [ ] **Marketing.** r/vscode "I made a thing" post + refresh Marketplace description text when v1.0.0 lands.

---

## 5. Provenance

Original plan derived from three independent AI model reviews (Claude Opus 4.7, GPT-5.5, Gemini 3.1 Pro) of the repository at version 0.3.8. Full individual plans archived in the session artifacts folder:

- `~/.copilot/session-state/<session>/files/plan-claude-opus.md`
- `~/.copilot/session-state/<session>/files/plan-gpt5.md`
- `~/.copilot/session-state/<session>/files/plan-gemini.md`

The synthesized master plan (everything in §§ 1–6 of the original document) was implemented in commit `5525003` ("Phase 1–3 modernization") and `c9a37b6` (extended color coverage + bug fixes). This trimmed document tracks only the work that remains.
