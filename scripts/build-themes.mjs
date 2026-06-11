#!/usr/bin/env node
/**
 * Build the published color theme JSON files from sources in src/.
 *
 * Inputs:
 *   src/palette.json       — named color roles per theme
 *   src/semantic.json      — shared semanticTokenColors (uses $role tokens)
 *   src/themes/<v>.json    — per-theme source (uses $role tokens)
 *
 * Outputs:
 *   themes/xbox-<v>.color-theme.json   — what ships in the .vsix
 *
 * Substitution rule: any string value matching the regex /^\$([a-zA-Z][a-zA-Z0-9]*)$/
 * is replaced with `palette[variant][role]`. Literal hex values pass through.
 * An unknown $role triggers a build error.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const VARIANTS = [
	{ key: "one",     out: "themes/xbox-one.color-theme.json"       },
	{ key: "xbox360", out: "themes/xbox-360.color-theme.json"       },
	{ key: "seriesX", out: "themes/xbox-series-x.color-theme.json"  },
];

const TOKEN = /^\$([a-zA-Z][a-zA-Z0-9]*)$/;

function loadJSON(rel) {
	return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

function resolveToken(value, palette, variant, ctx) {
	if (typeof value !== "string") return value;
	const m = TOKEN.exec(value);
	if (!m) return value;
	const role = m[1];
	if (!(role in palette)) {
		throw new Error(`Unknown palette role $${role} (in ${variant} @ ${ctx})`);
	}
	return palette[role];
}

function transformObject(obj, palette, variant, prefix) {
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		out[k] = resolveToken(v, palette, variant, `${prefix}.${k}`);
	}
	return out;
}

function transformSemantic(semanticSource, palette, variant) {
	const out = {};
	for (const [k, v] of Object.entries(semanticSource)) {
		if (v && typeof v === "object" && !Array.isArray(v)) {
			const entry = { ...v };
			for (const sub of ["foreground", "background"]) {
				if (sub in entry) {
					entry[sub] = resolveToken(entry[sub], palette, variant, `semantic.${k}.${sub}`);
				}
			}
			out[k] = entry;
		} else {
			out[k] = resolveToken(v, palette, variant, `semantic.${k}`);
		}
	}
	return out;
}

function transformTokenColors(rules, palette, variant) {
	return rules.map((rule, i) => {
		if (!rule.settings || typeof rule.settings !== "object") return rule;
		const settings = { ...rule.settings };
		for (const k of ["foreground", "background"]) {
			if (k in settings) {
				settings[k] = resolveToken(settings[k], palette, variant, `tokenColors[${i}].${k}`);
			}
		}
		return { ...rule, settings };
	});
}

function build() {
	const paletteDoc = loadJSON("src/palette.json");
	const semanticDoc = loadJSON("src/semantic.json");

	for (const { key, out } of VARIANTS) {
		const palette = paletteDoc[key];
		if (!palette) throw new Error(`No palette defined for variant '${key}' in src/palette.json`);

		const source = loadJSON(`src/themes/${key}.json`);
		const theme = {
			$schema: source.$schema ?? "vscode://schemas/color-theme",
			type: source.type ?? key,
			semanticHighlighting: semanticDoc.semanticHighlighting !== false,
			semanticTokenColors: transformSemantic(semanticDoc.semanticTokenColors ?? {}, palette, key),
			colors: transformObject(source.colors ?? {}, palette, key, "colors"),
			tokenColors: transformTokenColors(source.tokenColors ?? [], palette, key),
		};

		// Stable, sorted output matches the format established in Phase 2.
		const sorted = {
			$schema: theme.$schema,
			type: theme.type,
			semanticHighlighting: theme.semanticHighlighting,
			semanticTokenColors: Object.fromEntries(
				Object.keys(theme.semanticTokenColors).sort().map(k => [k, theme.semanticTokenColors[k]])
			),
			colors: Object.fromEntries(
				Object.keys(theme.colors).sort().map(k => [k, theme.colors[k]])
			),
			tokenColors: theme.tokenColors,
		};

		const dest = resolve(ROOT, out);
		mkdirSync(dirname(dest), { recursive: true });
		writeFileSync(dest, JSON.stringify(sorted, null, "\t") + "\n", "utf8");

		const tokenized = Object.values(source.colors).filter(v => typeof v === "string" && TOKEN.test(v)).length;
		const total = Object.keys(source.colors).length;
		console.log(`built ${out} — ${total} colors (${tokenized} via $role, ${total - tokenized} literal)`);
	}
}

try {
	build();
} catch (err) {
	console.error("build-themes failed:", err.message);
	process.exit(1);
}
