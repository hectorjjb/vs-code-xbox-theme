# Copilot instructions — Xbox VS Code Theme

A VS Code extension shipping six Xbox-inspired color themes plus two file icon
themes. There is **no runtime code**: everything is JSON, compiled from sources
by zero-dependency Node ESM build scripts.

## The one rule that breaks CI if ignored

**Never hand-edit anything in `themes/`.** Those `xbox-*.color-theme.json` files
are *generated* from `src/`. Edit the source, then run `npm run build` and commit
the regenerated output. CI runs `git diff --quiet -- themes/` and fails if the
committed files don't match a fresh build.

## Build / test / validate

```bash
npm ci                 # install locked deps (CI uses Node 24)
npm run build          # src/ -> themes/  (scripts/build-themes.mjs)
npm run validate       # strict checks on built output (scripts/validate-themes.mjs)
npm test               # = build && validate  (also runs as prepublishOnly)
npm run build:icons    # re-vendor file icons from vscode-icons (needs `unzip`)
npm run screenshots    # regenerate README images/ (headless Playwright + Shiki)
```

There is no unit-test framework. `npm run validate` is the test suite; run it
alone after a build to re-check without rebuilding. To validate a single theme,
temporarily narrow `FILES`/`VARIANTS` — or just read the per-file `✓/✗` output,
which is grouped by filename.

## Architecture: how a theme is compiled

```
src/palette.json   (named color roles per variant: bg, fg, green, …)
src/semantic.json  (shared semanticTokenColors, uses $role tokens)
src/themes/<key>.json  (per-variant colors + tokenColors, uses $role tokens)
        │  scripts/build-themes.mjs substitutes $role -> palette[variant][role]
        ▼
themes/xbox-<variant>.color-theme.json   ← the only files that ship in the .vsix
```

- **`scripts/variants.mjs` is the single source of truth** for the 6 variants
  (`{ key, out }`). Both the build script and validator import it, so they can't
  drift. Adding a theme = one entry here + `src/themes/<key>.json` + an optional
  `src/palette.json` block + a `contributes.themes` entry in `package.json`.
- **`$role` token substitution:** a string value of the exact form `"$roleName"`
  is replaced with that role's value for the current variant. Literal hex
  (`"#107c10"`) passes through untouched. An **unknown `$role` is a build error**
  by design — it catches typos.
- **`extends`:** a source may set `"extends": "<key>"` to inherit another
  variant's `type`, `colors`, `tokenColors`, and palette, then override. Current
  inheritance: `ogXbox` and `hcDark` extend `one`; `hcLight` extends `xbox360`.
- The build emits **sorted, tab-indented** output and auto-generates a `name` for
  any `tokenColors` rule lacking one — don't fight that formatting by hand.

## Key conventions

- **Prefer `$role` palette tokens over literal hex** in theme sources. To nudge a
  brand color, change the role in `src/palette.json` so every consumer stays
  consistent; reach for literal hex only for genuine one-offs.
- **Indentation:** tabs in `src/**/*.json` and `scripts/*.mjs`; **`package.json`
  uses 4-space** indentation — for programmatic edits use
  `JSON.stringify(value, null, 4)` to keep diffs minimal.
- **Scripts are Node ESM (`.mjs`) with zero runtime dependencies** — keep the
  build and validator dependency-free (`devDependencies` are tooling only:
  vsce, ovsx, playwright, shiki).
- **High Contrast variants** must preserve maximum contrast — don't swap pure
  black/white focus and border colors for brand tints without re-checking the
  ratio.
- **File icons are vendored, not authored here.** They come from the MIT
  `vscode-icons` project. "Colorful" is upstream as-is; "Green" is a
  deterministic duotone recolor via `scripts/icon-green.mjs`. After bumping the
  pinned version in `scripts/build-icon-theme.mjs`, update the "Vendored version"
  line in `THIRD-PARTY-NOTICES.md`.
- The color theme picker order is controlled by VS Code (groups by light/dark/HC,
  sorts alphabetically by label) — the `contributes.themes` array order is
  ignored.

## What ships vs. what doesn't

`.vscodeignore` keeps the `.vsix` to themes, fileicons, and the extension icon.
`src/`, `scripts/`, `samples/`, `docs/`, `previews/`, and most of `images/` are
excluded. `previews/` is local scratch (gitignored); regenerate and commit
`images/` when a palette or icon change alters the README screenshots.

## PRs & releases

- Branch off `main`, PR against `main`. Run `npm test` and commit regenerated
  `themes/` (and `images/` if affected) in the same PR.
- Add a `CHANGELOG.md` entry (Keep a Changelog format) for user-facing changes.
- Releases are manual (see CONTRIBUTING.md "Release process"); `docs/MODERNIZATION.md`
  tracks only remaining/outstanding work.
