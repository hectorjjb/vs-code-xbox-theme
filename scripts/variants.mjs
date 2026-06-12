/**
 * Single source of truth for the theme variants.
 *
 * `key` — source file basename under src/themes/<key>.json and palette key.
 * `out` — built color-theme path under themes/.
 *
 * Adding a new theme means adding ONE entry here (plus its src/ source,
 * palette, and package.json registration). Both the build script
 * (scripts/build-themes.mjs) and the validator (scripts/validate-themes.mjs)
 * read from this list, so they can never drift out of sync.
 */
export const VARIANTS = [
	{ key: "one",     out: "themes/xbox-one.color-theme.json"       },
	{ key: "xbox360", out: "themes/xbox-360.color-theme.json"       },
	{ key: "seriesX", out: "themes/xbox-series-x.color-theme.json"  },
	{ key: "ogXbox",  out: "themes/xbox-original.color-theme.json"  },
	{ key: "hcDark",  out: "themes/xbox-hc-dark.color-theme.json"   },
	{ key: "hcLight", out: "themes/xbox-hc-light.color-theme.json"  },
];
