# Xbox Theme for VS Code

[![Marketplace Version](https://vsmarketplacebadges.dev/version-short/hector-jimenez.xbox-theme.svg?label=VS%20Marketplace&color=107c10)](https://marketplace.visualstudio.com/items?itemName=hector-jimenez.xbox-theme)
[![Installs](https://vsmarketplacebadges.dev/installs-short/hector-jimenez.xbox-theme.svg?label=Installs&color=107c10)](https://marketplace.visualstudio.com/items?itemName=hector-jimenez.xbox-theme)
[![Rating](https://vsmarketplacebadges.dev/rating-star/hector-jimenez.xbox-theme.svg?label=Rating&color=107c10)](https://marketplace.visualstudio.com/items?itemName=hector-jimenez.xbox-theme&ssr=false#review-details)
[![GitHub stars](https://img.shields.io/github/stars/hectorjjb/vs-code-xbox-theme?color=107c10&logo=github)](https://github.com/hectorjjb/vs-code-xbox-theme/stargazers)
[![License](https://img.shields.io/badge/license-Apache--2.0-107c10.svg)](LICENSE)

Visual Studio Code color themes inspired by the Xbox console generations:

![Xbox console generations](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-console-generations.png)

**Console editions** (chronological):

- **XBOX (Original 2001)** — dark theme inspired by the matte-black original console and its translucent neon-green "jewel" logo (`#9bf00b`).
- **XBOX 360 (2005)** — clean light variant with Xbox green accents.
- **XBOX ONE (2013)** — the classic deep-charcoal dashboard look.
- **XBOX Series X (2020)** — 25th Anniversary edition inspired by the translucent OG Xbox green hardware — neutral warm grays with a soft controller-lime accent.

**High-contrast editions** (accessibility):

- **XBOX High Contrast Dark** — pure-black background with white text, bright contrast borders, and an accessible green accent (`#2ecc40`, ~9.8:1 contrast).
- **XBOX High Contrast Light** — pure-white background with black text and strong dark-green/blue contrast borders.

---

## Install

From inside VS Code:

1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`).
2. Search for **Xbox Theme**.
3. Click **Install**.
4. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **Preferences: Color Theme** → pick any **XBOX** theme (console editions or High Contrast).

Or from the command line:

```sh
code --install-extension hector-jimenez.xbox-theme
```

---

## Recommended settings

These themes are tuned for VS Code's semantic highlighting and bracket-pair colorization (the palette defines all six bracket levels and a full `semanticTokenColors` map). For the intended look, add to your `settings.json`:

```jsonc
{
  // Language-server-aware token colors (functions, types, parameters, etc.)
  "editor.semanticHighlighting.enabled": true,
  // Colorized matching brackets + active-pair guide
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active"
}
```

---

## Screenshots

Each theme rendered on the same source file, in console-generation order:

### XBOX (Original 2001)

![XBOX (Original 2001)](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-original.png)

### XBOX 360 (2005)

![XBOX 360 (2005)](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-360.png)

### XBOX ONE (2013)

![XBOX ONE (2013)](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-one.png)

### XBOX Series X (2020)

![XBOX Series X (2020)](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-series-x.png)

### XBOX High Contrast Dark

![XBOX High Contrast Dark](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-hc-dark.png)

### XBOX High Contrast Light

![XBOX High Contrast Light](https://raw.githubusercontent.com/hectorjjb/vs-code-xbox-theme/main/images/xbox-hc-light.png)

---

## Contributing

Issues and pull requests are welcome at [github.com/hectorjjb/vs-code-xbox-theme](https://github.com/hectorjjb/vs-code-xbox-theme).

If you find a UI element that isn't colored well (or at all), please open an issue with a screenshot and the VS Code version.

---

## License

[Apache-2.0](LICENSE) © Hector Jimenez
