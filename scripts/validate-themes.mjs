#!/usr/bin/env node
/**
 * Validate the built theme files. Zero runtime dependencies.
 *
 * Checks:
 *   1) Strict JSON.parse succeeds (catches the trailing-comma class of bug).
 *   2) Top-level structure is well-formed:
 *      - `$schema`, `type` (dark|light|hc-dark|hc-light)
 *      - `colors`: object<string, string>
 *      - `tokenColors`: array<{ scope?: string|string[], settings: object }>
 *      - `semanticTokenColors`: object<string, string|object>
 *   3) All hex color values are well-formed (#rgb, #rrggbb, #rrggbbaa).
 *   4) Dark and light have the same `colors` key set (parity).
 *   5) No duplicate scopes across or within tokenColors rules.
 *   6) The file icon theme parses, every iconPath resolves to a real SVG, and
 *      every icon reference points at a defined iconDefinition.
 *
 * Exit code: 0 on success, 1 on a real error.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VARIANTS } from "./variants.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ICON_THEMES = [
	"fileicons/xbox-icon-theme.json",
	"fileicons/xbox-icon-theme-green.json",
];

const FILES = VARIANTS.map(v => v.out);

const VALID_TYPES = new Set(["dark", "light", "hc-dark", "hc-light", "hc"]);
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

let hadError = false;
let hadWarning = false;
const log = {
	ok:    (m) => console.log(`  ✓ ${m}`),
	warn:  (m) => { hadWarning = true; console.log(`  ! ${m}`); },
	error: (m) => { hadError = true;   console.log(`  ✗ ${m}`); },
};

function loadStrict(rel) {
	const text = readFileSync(resolve(ROOT, rel), "utf8");
	return JSON.parse(text);
}

function validateStructure(theme, label) {
	if (typeof theme !== "object" || theme === null || Array.isArray(theme)) {
		log.error(`${label}: root must be an object`);
		return;
	}
	if (!("type" in theme) || !VALID_TYPES.has(theme.type)) {
		log.error(`${label}: invalid or missing "type" (got ${JSON.stringify(theme.type)})`);
	}
	if (!theme.$schema) {
		log.warn(`${label}: missing "$schema" (recommended: "vscode://schemas/color-theme")`);
	}
	if (typeof theme.colors !== "object" || theme.colors === null || Array.isArray(theme.colors)) {
		log.error(`${label}: "colors" must be an object`);
	}
	if (!Array.isArray(theme.tokenColors)) {
		log.error(`${label}: "tokenColors" must be an array`);
	} else {
		theme.tokenColors.forEach((r, i) => {
			if (typeof r !== "object" || r === null) {
				log.error(`${label}: tokenColors[${i}] must be an object`);
				return;
			}
			if (typeof r.settings !== "object" || r.settings === null) {
				log.error(`${label}: tokenColors[${i}].settings must be an object`);
			}
			if ("scope" in r && typeof r.scope !== "string" && !Array.isArray(r.scope)) {
				log.error(`${label}: tokenColors[${i}].scope must be string or string[]`);
			}
		});
	}
	if ("semanticTokenColors" in theme && (typeof theme.semanticTokenColors !== "object" || theme.semanticTokenColors === null || Array.isArray(theme.semanticTokenColors))) {
		log.error(`${label}: "semanticTokenColors" must be an object`);
	}
	log.ok(`${label}: structure OK`);
}

function validateHexValues(theme, label) {
	let bad = 0;
	for (const [k, v] of Object.entries(theme.colors ?? {})) {
		if (typeof v === "string" && v.startsWith("#") && !HEX_RE.test(v)) {
			log.error(`${label}: colors.${k} is not a valid hex color: ${JSON.stringify(v)}`);
			bad++;
		}
	}
	(theme.tokenColors ?? []).forEach((r, i) => {
		const s = r.settings;
		if (!s || typeof s !== "object") return;
		for (const sub of ["foreground", "background"]) {
			const v = s[sub];
			if (typeof v === "string" && v.startsWith("#") && !HEX_RE.test(v)) {
				log.error(`${label}: tokenColors[${i}].${sub} is not a valid hex color: ${JSON.stringify(v)}`);
				bad++;
			}
		}
	});
	if (bad === 0) log.ok(`${label}: all color values look well-formed`);
}

function scopeList(scope) {
	if (scope == null) return [];
	if (Array.isArray(scope)) return scope;
	if (typeof scope === "string") {
		return scope.includes(",") ? scope.split(",").map(s => s.trim()) : [scope];
	}
	return [];
}

function validateNoDuplicateScopes(theme, label) {
	const seen = new Map();
	let dups = 0;
	(theme.tokenColors ?? []).forEach((r, i) => {
		for (const s of scopeList(r.scope)) {
			if (seen.has(s)) {
				log.error(`${label}: duplicate scope "${s}" in tokenColors[${i}] (first seen at index ${seen.get(s)})`);
				dups++;
			} else {
				seen.set(s, i);
			}
		}
	});
	if (dups === 0) log.ok(`${label}: no duplicate tokenColors scopes`);
}

function validateParity(dark, light) {
	const dk = new Set(Object.keys(dark.colors ?? {}));
	const lk = new Set(Object.keys(light.colors ?? {}));
	const darkOnly  = [...dk].filter(k => !lk.has(k)).sort();
	const lightOnly = [...lk].filter(k => !dk.has(k)).sort();
	if (darkOnly.length > 0) {
		log.error(`parity: ${darkOnly.length} key(s) present in XBOX ONE but missing from XBOX 360`);
		darkOnly.slice(0, 10).forEach(k => log.error(`    - ${k}`));
	}
	if (lightOnly.length > 0) {
		log.warn(`parity: ${lightOnly.length} key(s) present in XBOX 360 but not in XBOX ONE (allowed; light-only keys are palette-mapped)`);
		lightOnly.slice(0, 10).forEach(k => console.log(`      - ${k}`));
	}
	if (darkOnly.length === 0 && lightOnly.length === 0) {
		log.ok("parity: XBOX ONE and XBOX 360 expose identical color key sets");
	}
}

function validateIconTheme(rel) {
	console.log(rel);
	let theme;
	try {
		theme = loadStrict(rel);
		log.ok("strict JSON.parse succeeded");
	} catch (e) {
		log.error(`strict JSON.parse failed: ${e.message}`);
		return;
	}

	const defs = theme.iconDefinitions;
	if (typeof defs !== "object" || defs === null || Array.isArray(defs)) {
		log.error(`${rel}: "iconDefinitions" must be an object`);
		return;
	}

	// Every iconDefinition's iconPath must resolve to a real file.
	const base = dirname(resolve(ROOT, rel));
	let missing = 0;
	for (const [id, def] of Object.entries(defs)) {
		const p = def && def.iconPath;
		if (typeof p !== "string" || p.length === 0) {
			log.error(`${rel}: iconDefinitions.${id} has no iconPath`);
			continue;
		}
		if (!existsSync(resolve(base, p))) {
			log.error(`${rel}: iconDefinitions.${id} -> ${p} (file not found)`);
			missing++;
		}
	}
	if (missing === 0) log.ok(`${rel}: all ${Object.keys(defs).length} icon files resolve`);

	// Every icon reference (file/folder + the mapping tables, incl. the light
	// override block) must point at a defined iconDefinition id.
	const refKeys = ["file", "folder", "folderExpanded", "rootFolder", "rootFolderExpanded"];
	const refMaps = ["folderNames", "folderNamesExpanded", "fileExtensions", "fileNames", "languageIds"];
	let dangling = 0;
	const checkRef = (id, where) => {
		if (id != null && !(id in defs)) {
			log.error(`${rel}: ${where} references undefined iconDefinition "${id}"`);
			dangling++;
		}
	};
	const checkScope = (scope) => {
		for (const k of refKeys) checkRef(scope[k], k);
		for (const m of refMaps) {
			for (const [name, id] of Object.entries(scope[m] ?? {})) checkRef(id, `${m}.${name}`);
		}
	};
	checkScope(theme);
	if (theme.light) checkScope(theme.light);
	if (theme.highContrast) checkScope(theme.highContrast);
	if (dangling === 0) log.ok(`${rel}: all icon references resolve to defined icons`);
	console.log("");
}

function main() {
	console.log("validate-themes\n");
	const themes = {};
	for (const f of FILES) {
		console.log(f);
		try {
			themes[f] = loadStrict(f);
			log.ok("strict JSON.parse succeeded");
		} catch (e) {
			log.error(`strict JSON.parse failed: ${e.message}`);
			continue;
		}
		validateStructure(themes[f], f);
		validateHexValues(themes[f], f);
		validateNoDuplicateScopes(themes[f], f);
		console.log("");
	}

	for (const t of ICON_THEMES) validateIconTheme(t);

	console.log("parity");
	if (themes[FILES[0]] && themes[FILES[1]]) {
		validateParity(themes[FILES[0]], themes[FILES[1]]);
	}

	console.log("");
	if (hadError) {
		console.error("validate-themes: FAILED");
		process.exit(1);
	}
	console.log(hadWarning ? "validate-themes: OK (with warnings)" : "validate-themes: OK");
}

main();
