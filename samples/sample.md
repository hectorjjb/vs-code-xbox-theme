# Xbox Console Generations

> 25 years of Xbox, in one page. _Last updated: **2026-06-10**_.

## Timeline

| Generation | Console        | Released   | Units (M) |
|-----------:|----------------|------------|----------:|
| 1          | Xbox           | 2001-11-15 |        24 |
| 2          | Xbox 360       | 2005-11-22 |        84 |
| 3          | Xbox One       | 2013-11-22 |        58 |
| 4          | Xbox Series X  | 2020-11-10 |        25 |

## Highlights

- **Xbox** — first Microsoft-made console; introduced built-in ethernet and a hard drive.
- **Xbox 360** — Xbox Live Arcade, achievements, and the famous _red ring of death_.
- **Xbox One** — Kinect 2.0, voice control, and a unified gaming/media identity.
- **Xbox Series X** — 4K @ 120fps, raytracing, [Quick Resume][qr], and Game Pass first-party.

[qr]: https://news.xbox.com/quick-resume "Quick Resume on Xbox Series X|S"

## Example code

```ts
import { fetchConsoles } from "./xbox";

const consoles = await fetchConsoles();
console.log(`Found ${consoles.length} consoles`);
```

```bash
# Install the VS Code Xbox theme
code --install-extension hector-jimenez.xbox-theme
```

### Notes

1. Numbered list item one.
2. Numbered list item two with **bold**, _italic_, and `inline code`.
3. Final item with a [link to Microsoft](https://www.microsoft.com).

---

_Image credits: [Xbox press kit](https://news.xbox.com/)._
