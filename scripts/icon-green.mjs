/**
 * Xbox-green duotone recolor for the bundled file icons.
 *
 * The "XBOX Icons Green" theme is derived deterministically from the full-color
 * "XBOX Icons Colorful" set by baking a single SVG <filter> into each icon:
 *   1) `feColorMatrix type="saturate" values="0"` flattens the icon to luminance,
 *      so every icon's internal shading/edges survive (multi-color logos stay
 *      recognizable instead of collapsing into a flat silhouette).
 *   2) `feComponentTransfer` maps that luminance onto a dark→bright green ramp
 *      drawn from the palette: #0c5f0c (dark) → #5dc21e (bright).
 *
 * No per-icon color parsing is involved, so the transform is robust across the
 * whole vendored set and reproducible on every re-vendor.
 */

export const GREEN_FILTER_ID = "xboxGreen";

// Ramp endpoints (sRGB 0..1): low = #0c5f0c, high = #5dc21e.
const GREEN_FILTER =
	`<filter id="${GREEN_FILTER_ID}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
	`<feColorMatrix type="saturate" values="0"/>` +
	`<feComponentTransfer>` +
	`<feFuncR type="table" tableValues="0.047 0.365"/>` +
	`<feFuncG type="table" tableValues="0.373 0.761"/>` +
	`<feFuncB type="table" tableValues="0.047 0.118"/>` +
	`</feComponentTransfer>` +
	`</filter>`;

/**
 * Wrap an SVG document's content in the green duotone filter.
 * @param {string} svg raw SVG markup (full-color source icon)
 * @returns {string} recolored SVG markup
 */
export function greenifySvg(svg) {
	const m = svg.match(/^([\s\S]*?<svg[^>]*>)([\s\S]*)(<\/svg>\s*)$/i);
	if (!m) throw new Error("greenifySvg: no <svg> root element found");
	const [, open, body, close] = m;
	return `${open}<defs>${GREEN_FILTER}</defs><g filter="url(#${GREEN_FILTER_ID})">${body}</g>${close}`;
}
