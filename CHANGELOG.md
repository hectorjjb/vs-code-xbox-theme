# Changelog

All notable changes to **XBOX Themes** will be documented in this file.

The format is based on [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.2] — 2026-06-19

### Changed

- **Renamed display name** from "XBOX Theme" (singular) to **"XBOX Themes"** (plural) to accurately reflect that the extension ships six color themes plus two icon themes. The extension ID (`hector-jimenez.xbox-theme`), Marketplace URL, and all theme labels are unchanged — only the title shown in the Marketplace listing, Extensions sidebar, and quick-picker headers updates. Existing installs continue to receive updates seamlessly.
- The sibling **Visual Studio 2026** extension launched today at <https://marketplace.visualstudio.com/items?itemName=hector-jimenez.vs-xbox-theme> under the same "XBOX Themes" display name, keeping branding consistent across both Marketplaces.

## [0.9.1] — 2026-06-12

### Changed

- **Renamed the colorful file icon theme id** from `xbox-icons` to `xbox-icons-colorful` so both icon themes follow a consistent `xbox-icons-<variant>` scheme. If you previously set `"workbench.iconTheme": "xbox-icons"`, update it to `"xbox-icons-colorful"` (the picker label **XBOX Icons Colorful** is unchanged).

### Internal

- Renamed the colorful theme manifest `fileicons/xbox-icon-theme.json` → `fileicons/xbox-icon-theme-colorful.json` to mirror `xbox-icon-theme-green.json`; updated the build, validation, and screenshot scripts accordingly.

## [0.9.0] — 2026-06-12

### Added

- **XBOX Icons Green** — a second file icon theme that recolors the full icon set into a single XBOX-green duotone for a brand-consistent, monochrome-style Explorer. Enable via **Preferences: File Icon Theme → XBOX Icons Green**. Derived deterministically from the colorful set (baked SVG `feColorMatrix` + green-ramp `feComponentTransfer`, so each icon keeps its internal shape/shading instead of flattening to a silhouette).

### Changed

- The original file icon theme is now labelled **XBOX Icons Colorful** (id `xbox-icons` is unchanged, so existing selections keep working).
- Bundled icons are split into `fileicons/icons/colorful/` and `fileicons/icons/green/`; `npm run build:icons` regenerates both in one pass.
- README documents both icon themes with a Default / Colorful / Green comparison.

### Internal

- `scripts/icon-green.mjs` — shared green-duotone recolor used by the icon build and validated by `npm run validate` (both icon themes' paths are checked). The screenshot generator now renders default/colorful/green Explorer panels.

## [0.8.2] — 2026-06-12

### Changed

- **Light theme (XBOX 360) rebrand** — accent, selection, and interaction colors shifted from Microsoft-blue to XBOX green: editor selection, active line number, progress bar, menu/list selection, match highlights, fold/hover/drop/peek/snippet tints, button hover, and the notebook/settings change indicators. Semantic colors are intentionally preserved — info-blue, git status, the bracket/syntax rainbow, and terminal ANSI blue/cyan.
- **XBOX High Contrast Light** — focus/hover and modified-item indicators nudged to green to match the rebrand.
- README screenshots are now generated deterministically, and each theme includes a collapsible **color palette** sheet.

### Internal

- Light theme (`xbox360`) palette fully tokenized (100% `$role` tokens, byte-identical output), completing the tokenization effort started on the dark themes.
- New `scripts/screenshots.mjs` generator (Playwright + Shiki) renders the committed README assets in `images/`; `playwright`/`shiki` added as devDependencies (not shipped in the VSIX).

## [0.8.1] — 2026-06-11

### Changed

- README now includes a before/after comparison showing the **XBOX Icons** file icon theme applied in the Explorer.

## [0.8.0] — 2026-06-11

### Added

- **XBOX Icons file icon theme** — a full-coverage file/folder icon set for the Explorer that pairs with the color themes (1,336 icon definitions spanning common languages, frameworks, configs, and folders). Enable via **Preferences: File Icon Theme → XBOX Icons**. The icon theme is independent of the color theme and can be mixed with any theme or pinned per-workspace via `workbench.iconTheme`.
- `THIRD-PARTY-NOTICES.md` documenting bundled third-party assets.

### Changed

- README and `docs/MODERNIZATION.md` updated to document the file icon theme and its attribution.

### Credits

- File icons are bundled from the MIT-licensed [vscode-icons](https://github.com/vscode-icons/vscode-icons) project (© 2016 Roberto Huertas).

## [0.7.1] — 2026-06-11

### Fixed

- Marketplace description now reflects all six themes (every console generation plus High Contrast Dark & Light) instead of only listing three consoles.

## [0.7.0] — 2026-06-11

### Added

- **XBOX (Original 2001) theme** — a dark variant inspired by the matte-black original console and its translucent neon-green "jewel" logo (`#9bf00b`), completing the four-generation console set.
- **XBOX High Contrast Dark** and **XBOX High Contrast Light** themes — accessibility-focused variants with pure black/white backgrounds, contrast borders (`contrastBorder` / `contrastActiveBorder`), and an accessible green accent (`#2ecc40`, ~9.8:1 contrast both ways).
- Build pipeline now supports an `extends` field in `src/themes/*.json`, so derived variants are thin override files instead of full duplicates.
- Generated `name` fields on every `tokenColors` rule (derived from scope), so the shipped theme files are self-documenting.
- Theme labels now include console release years (e.g. **XBOX 360 (2005)**, **XBOX ONE (2013)**, **XBOX Series X (2020)**).

### Changed

- README now showcases all six themes with a full screenshot each, in console-generation order.
- Replaced the retired shields.io `visual-studio-marketplace` badges (version/installs/rating) with `vsmarketplacebadges.dev` equivalents, and added a GitHub stars badge.
- Slimmed the published `.vsix` by excluding screenshot images (only the extension icon ships).

### Fixed

- Color-key parity between the light and dark base themes.
- Accessibility: forced dark text on every green background (buttons, badges, picker selection, status bar, chat avatars, etc.) and fixed the fuzzy-match bold-highlight contrast on focused rows across all themes (now WCAG AA/AAA). Toned down the high-contrast lime from `#3ff23f` to `#2ecc40`.

## [0.6.3] — 2026-06-11

### Changed
- Updated the extension icon to the green XBOX sphere logo.

## [0.6.2] — 2026-06-10

### Changed
- Tuned terminal ANSI palette for XBOX ONE and XBOX Series X: `ansiGreen` now uses each variant's canonical XBOX green (XBOX green `#107c10` / controller lime `#7fc83a`), `ansiYellow` uses XBOX yellow (`#ffd800` / `#ffe34a`), and `ansiBrightBlue` upgraded to XBOX blue `#0078d4`. Affects generic terminal output (git, npm, ls --color); Copilot CLI emits truecolor and is unaffected.

## [0.6.1] — 2026-06-10

### Fixed
- README images now use absolute `raw.githubusercontent.com` URLs so they render on the VS Marketplace listing.

## [0.6.0] — 2026-06-10

### Added

- **XBOX Series X theme** — new dark variant celebrating the XBOX 25th Anniversary, inspired by the translucent OG XBOX green hardware (2001). Neutral warm grays with a soft controller-lime accent (`#7fc83a`), dark text on every lime surface, and XBOX-yellow (`#ffd800`) activity-bar badges. Built from the same `src/themes/` source pipeline as the other variants; selectable as **XBOX Series X** in the theme picker.
- `docs/xbox-console-generations.png` — console-generations reference image used in the README and as the long-term roadmap for the four-theme set (XBOX, XBOX 360, XBOX ONE, XBOX Series X).

### Changed

- Renamed contributed theme labels and underlying file artifacts to align with XBOX console generations. **Note**: file paths in `themes/` changed — users who selected the previous labels (`XBOX Dark`, `XBOX Light`) may need to reselect from the Color Theme picker after upgrading.
  - `XBOX Dark` → **XBOX ONE** (`themes/xbox-dark.color-theme.json` → `themes/xbox-one.color-theme.json`)
  - `XBOX Light` → **XBOX 360** (`themes/xbox-light.color-theme.json` → `themes/xbox-360.color-theme.json`)
  - new: **XBOX Series X** (`themes/xbox-series-x.color-theme.json`)
- Source files in `src/themes/` renamed to match: `dark.json` → `one.json`, `light.json` → `xbox360.json`, plus new `seriesX.json`. Palette variant keys in `src/palette.json` renamed correspondingly (`dark` → `one`, `light` → `xbox360`, new `seriesX`).
- Activity-bar badges across all three themes now use XBOX-yellow (`#ffd800`) with black text for maximum legibility.

### Planned

- **XBOX theme** — a fourth variant inspired by the original 2001 console to complete the four-generation set.

## [0.5.0] — 2026-06-10

### Added

#### Build pipeline & DX

- Single-source build pipeline: `src/palette.json` (named color roles per theme), `src/semantic.json` (shared `semanticTokenColors`), `src/themes/{dark,light}.json` (theme source using `$role` palette tokens).
- `scripts/build-themes.mjs` — resolves `$role` tokens against the per-theme palette and writes the committed `themes/*.color-theme.json` artifacts.
- `scripts/validate-themes.mjs` — zero-dep validator: strict `JSON.parse`, structural check, hex-color check, dark↔light color-key parity, no duplicate `tokenColors` scopes.
- npm scripts: `build`, `validate`, `test` (build + validate), `package`, `publish:vsce`, `publish:ovsx`; `prepublishOnly` runs `test`.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): build, validate, fail-on-drift between `src/` and committed `themes/`, dry-pack with `vsce`.
- Dependabot config (`.github/dependabot.yml`): weekly updates for npm + github-actions.
- `.gitignore` (was missing).

#### Color coverage

- Coverage for modern VS Code UI surfaces in both themes: command center, sticky scroll (editor + panel + sidebar + terminal), inlay hints, ghost text / inline suggestions, bracket pair guides, chat & inline chat, agents, inline edit, testing, terminal command decorations, profile badge, multi-diff editor, banner, merge editor, SCM graph, action bar, toolbar, comments view, ports, welcome page, editor watermark, debug view, keybinding table, tree table, notebook expansions, settings editor.
- `semanticHighlighting: true` + baseline `semanticTokenColors` block mapped to the XBOX palette.
- 63 additional color keys for previously-uncovered VS Code surfaces: `radio.*`, `notebook.{editorBackground,cellBorderColor,focusedEditorBorder}`, `debugConsole.{error,info,warning,source}Foreground`, `keybindingLabel.*`, `activityBarTop.*`, `extensionButton.*`, `welcomePage.{button,tileShadow}*`, `activityErrorBadge.*`, `activityWarningBadge.*`, `panelTitleBadge.*`, `diffEditorGutter.*`, `diffEditorOverview.*`, `statusBarItem.remoteHover*`, `tab.{hover,unfocusedHover}Foreground`, etc.
- Restored light theme parity for `charts.*` and most TextMate scopes previously only in dark.

#### Tier 1 brand experiment — XBOX green markers

- `focusBorder`, `sash.hoverBorder` → `$greenNeon` (#9bf00b) on dark — focus rings now pop instead of blending in.
- `panelTitle.activeBorder` → `$green`, `panelTitle.activeForeground` → `$greenNeon` — active panel tab marker.
- `textLink.activeForeground`, `editorLink.activeForeground` → `$greenNeon` — link hover treatment.
- `list.focusOutline` set explicitly to remove fallback ambiguity (unified single-color focused-row border).
- `titleBar.activeForeground` brightened to `$fg` on dark (was `$fgDim`).

### Changed

- Bumped `engines.vscode` from `^1.44.0` to `^1.90.0`.
- Removed duplicate TextMate scope rules in both theme files.
- Filled-in partial color groups: `statusBarItem.*`, `diffEditor.unchangedRegion*`, `menu.*`, `tab.selected*`, `quickInput.*`, `editorGroup.dropInto*`, `editorBracketHighlight.unexpectedBracket.foreground`.
- All hex values in built themes are now normalized to lowercase (cosmetic only — semantically identical).

### Fixed

- `entity.other.attribute-name` was `#FFFFFF77` (47% alpha white, barely legible). Now `$blue #66d9ef italic`, matching the cyan-italic family used for `storage.type` / `support.type`. HTML/JSX/CSS attribute names are readable again.
- `badge.background` was `#ffffff3d` (24% alpha white, unpredictable contrast). Now `$bgAlt #3b3c35` (solid neutral).
- `tab.selectedBorderTop` was `$green` (drew a darker green strip on top of every active tab, fighting the `$greenNeon` bottom underline). Now `$transparent` — active tab is marked only by the neon underline.
- `list.dropBetweenBackground` was `$green` (drew a darker line between Explorer rows that visually competed with the focus outline). Now `$greenNeon` for consistency.

### Removed

- Dead `themes/palette.css` file (superseded by `src/palette.json`).

## [0.4.0] — 2026-06-10

### Added

- Registered **XBOX Light** in the extension manifest so it is selectable from the Color Theme picker.
- Marketplace metadata: `galleryBanner` (XBOX green), badges, `qna`, `sponsor`, `extensionKind`, expanded `keywords`.
- `.vscodeignore` so dev-only files are excluded from the published `.vsix`.
- Modern README with badges, install instructions, dark + light screenshots, recommended settings, and palette table.
- Changelog adopts the Keep a Changelog format.

### Changed

- Bumped `engines.vscode` from `^1.44.0` to `^1.74.0` (covers >99% of installed VS Code).
- Renamed contributed labels: `XBOX Dark Theme` → `XBOX Dark`, added `XBOX Light`.
- Moved `xbox_one.png` into `images/` and updated the `icon` path.
- Updated `description` to mention both dark and light themes.

### Fixed

- Removed trailing comma at the end of the `colors` block in `themes/xbox-dark.color-theme.json` (would have broken strict `JSON.parse`).
- Removed inaccurate "coming soon" line for the light theme in the README (it has existed for a long time).

## [0.3.8] — 2022-09-06

### Added

- Chart colors for the dark theme (`charts.*`).

### Fixed

- Editor theme additions.

[Unreleased]: https://github.com/hectorjjb/vs-code-xbox-theme/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/hectorjjb/vs-code-xbox-theme/compare/v0.3.8...v0.4.0
[0.3.8]: https://github.com/hectorjjb/vs-code-xbox-theme/releases/tag/v0.3.8
