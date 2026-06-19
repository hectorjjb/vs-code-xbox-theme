# XBOX VS Code Theme — Remaining Work

> This document tracks **only what's left**. For everything that has shipped —
> the six color themes (including High Contrast Dark/Light), the two file icon
> themes (Colorful + Green), the deterministic screenshot generator, the light
> palette tokenization + XBOX-green rebrand, repo hygiene (issue/PR templates,
> attribution), and the build/validate/CI pipeline — see `CHANGELOG.md`.
>
> See commit `5525003` for the original full modernization plan if you need
> historical context.

---

## 1. Publish automation

The build pipeline (`npm run build` / `validate` / `test`) and CI workflow
(`.github/workflows/ci.yml`) are in place. Releasing is still manual
(`npm run publish:vsce`).

- [ ] `.github/workflows/release.yml` triggered by `release: published`
  - Runs `npm run test`
  - Runs `npm run package` (creates `.vsix`)
  - Runs `npm run publish:vsce` (uses `VSCE_PAT` secret)
  - Runs `npm run publish:ovsx` (uses `OVSX_PAT` secret) — Open VSX for VSCodium/Cursor users
  - Attaches `.vsix` to the GitHub Release
- [ ] Add `VSCE_PAT` and `OVSX_PAT` to repo secrets (manual step)
- [ ] A future release: bump version to **`1.0.0`** to signal stability

---

## 2. Tooling follow-ups

- [ ] Optional: a CI step to verify the committed `images/` are regenerable and
  in sync with `npm run screenshots` (the previews are a reproducible *mock*,
  not pixel-identical to a real VS Code capture).

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
| **Orange wash** | `#e3641a4d` (30% `$orange`) | XBOX-brand-adjacent (parameter terracotta); orange is rare in syntax → never overlaps; warm + distinctive |
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

- [ ] **Open VSX publishing.** Worth the extra workflow step + secret to reach VSCodium / Cursor / Gitpod users? (Recommendation: yes — Open VSX install is ~free, audience is non-trivial.)
- [ ] **Marketing.** r/vscode "I made a thing" post + refresh Marketplace description text when v1.0.0 lands.

---

## 5. Provenance

Original plan derived from three independent AI model reviews (Claude Opus 4.7, GPT-5.5, Gemini 3.1 Pro) of the repository at version 0.3.8. Full individual plans archived in the session artifacts folder:

- `~/.copilot/session-state/<session>/files/plan-claude-opus.md`
- `~/.copilot/session-state/<session>/files/plan-gpt5.md`
- `~/.copilot/session-state/<session>/files/plan-gemini.md`

The synthesized master plan was implemented in commits `5525003` ("Phase 1–3 modernization") and `c9a37b6` (extended color coverage + bug fixes). This document tracks only the work that remains.
