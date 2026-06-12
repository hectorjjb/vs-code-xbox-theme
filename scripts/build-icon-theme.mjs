#!/usr/bin/env node
/**
 * Re-vendor the bundled XBOX file icon themes from vscode-icons (MIT).
 *
 * Two icon themes are produced from one vendored set:
 *   • "XBOX Icons Colorful" — the upstream full-color icons (icons/colorful/).
 *   • "XBOX Icons Green"    — an Xbox-green duotone recolor of the same set,
 *                             derived deterministically (icons/green/, see
 *                             scripts/icon-green.mjs).
 *
 * What it does (reproducible — safe to re-run):
 *   1) Downloads the vscode-icons .vsix for a pinned version from the Marketplace.
 *   2) Extracts it (uses the system `unzip`).
 *   3) Copies every SVG into fileicons/icons/colorful/ (rebuilt from scratch).
 *   4) Reads vscode-icons' generated icon-theme JSON, rewrites each `iconPath`
 *      from `../../icons/` to `./icons/colorful/`, and backfills the empty
 *      light-default slots with their dark equivalents so light/HC themes still
 *      get icons. Writes fileicons/xbox-icon-theme-colorful.json.
 *   5) Greenifies every SVG into fileicons/icons/green/ and writes the derived
 *      fileicons/xbox-icon-theme-green.json (same map, paths re-pointed).
 *
 * Usage:
 *   node scripts/build-icon-theme.mjs            # uses the pinned VERSION below
 *   node scripts/build-icon-theme.mjs 12.19.0    # vendor a specific version
 *
 * After bumping the version, update the "Vendored version" line in
 * THIRD-PARTY-NOTICES.md to match.
 */

import { execFileSync } from "node:child_process";
import {
	mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync,
	readdirSync, copyFileSync, existsSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { greenifySvg } from "./icon-green.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const PUBLISHER = "vscode-icons-team";
const EXTENSION = "vscode-icons";
// Pinned upstream version. Keep in sync with THIRD-PARTY-NOTICES.md.
const DEFAULT_VERSION = "12.18.0";

const ICONS_OUT = resolve(ROOT, "fileicons/icons/colorful");
const GREEN_OUT = resolve(ROOT, "fileicons/icons/green");
const THEME_OUT = resolve(ROOT, "fileicons/xbox-icon-theme-colorful.json");
const GREEN_THEME_OUT = resolve(ROOT, "fileicons/xbox-icon-theme-green.json");
const ICON_PATH_PREFIX = "../../icons/";
const COLORFUL_DIR = "./icons/colorful/";
const GREEN_DIR = "./icons/green/";

// The 5 light-default icon ids ship with an empty iconPath upstream; map them
// to their dark equivalents so light/HC themes still render a default icon.
const LIGHT_DEFAULT_FALLBACK = {
	_file_light: "_file",
	_folder_light: "_folder",
	_folder_light_open: "_folder_open",
	_root_folder_light: "_root_folder",
	_root_folder_light_open: "_root_folder_open",
};

function vsixUrl(version) {
	return `https://${PUBLISHER}.gallery.vsassets.io/_apis/public/gallery/publisher/` +
		`${PUBLISHER}/extension/${EXTENSION}/${version}/assetbyname/` +
		`Microsoft.VisualStudio.Services.VSIXPackage`;
}

async function downloadVsix(version, destFile) {
	const url = vsixUrl(version);
	console.log(`downloading vscode-icons v${version} …`);
	const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
	if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(destFile, buf);
	console.log(`  saved ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
}

function rewriteIconPaths(theme) {
	for (const [id, src] of Object.entries(LIGHT_DEFAULT_FALLBACK)) {
		if (theme.iconDefinitions[id] && theme.iconDefinitions[src]) {
			theme.iconDefinitions[id].iconPath = theme.iconDefinitions[src].iconPath;
		}
	}
	let rewritten = 0;
	for (const def of Object.values(theme.iconDefinitions)) {
		if (typeof def.iconPath === "string" && def.iconPath.startsWith(ICON_PATH_PREFIX)) {
			def.iconPath = COLORFUL_DIR + def.iconPath.slice(ICON_PATH_PREFIX.length);
			rewritten++;
		}
	}
	return rewritten;
}

/** Verify every iconPath in a theme resolves on disk (relative to fileicons/). */
function verifyPaths(theme, label) {
	let missing = 0;
	for (const [id, def] of Object.entries(theme.iconDefinitions)) {
		if (!def.iconPath || !existsSync(resolve(dirname(THEME_OUT), def.iconPath))) {
			console.error(`  missing (${label}): ${id} -> ${def.iconPath}`);
			missing++;
		}
	}
	if (missing > 0) throw new Error(`${missing} ${label} icon path(s) do not resolve`);
}

/** Derive the green icon set + theme from the just-built colorful one. */
function buildGreen(theme, svgs) {
	rmSync(GREEN_OUT, { recursive: true, force: true });
	mkdirSync(GREEN_OUT, { recursive: true });
	for (const f of svgs) {
		writeFileSync(join(GREEN_OUT, f), greenifySvg(readFileSync(join(ICONS_OUT, f), "utf8")));
	}
	console.log(`greenified ${svgs.length} SVGs -> fileicons/icons/green/`);

	const green = JSON.parse(JSON.stringify(theme));
	for (const def of Object.values(green.iconDefinitions)) {
		if (typeof def.iconPath === "string" && def.iconPath.startsWith(COLORFUL_DIR)) {
			def.iconPath = GREEN_DIR + def.iconPath.slice(COLORFUL_DIR.length);
		}
	}
	verifyPaths(green, "green");
	writeFileSync(GREEN_THEME_OUT, JSON.stringify(green, null, 2) + "\n", "utf8");
	console.log(`wrote fileicons/xbox-icon-theme-green.json (${Object.keys(green.iconDefinitions).length} icon definitions)`);
}

async function main() {
	const version = process.argv[2] || DEFAULT_VERSION;
	const work = mkdtempSync(join(tmpdir(), "xbox-icons-"));
	try {
		const vsix = join(work, "vscode-icons.vsix");
		await downloadVsix(version, vsix);

		const extractDir = join(work, "ext");
		mkdirSync(extractDir, { recursive: true });
		execFileSync("unzip", ["-o", "-q", vsix, "-d", extractDir]);

		const srcIcons = join(extractDir, "extension", "icons");
		const srcTheme = join(extractDir, "extension", "dist", "src", "vsicons-icon-theme.json");
		if (!existsSync(srcIcons) || !existsSync(srcTheme)) {
			throw new Error("unexpected vsix layout — icons/ or generated theme JSON not found");
		}

		// Rebuild fileicons/icons/colorful from scratch.
		rmSync(ICONS_OUT, { recursive: true, force: true });
		mkdirSync(ICONS_OUT, { recursive: true });
		const svgs = readdirSync(srcIcons).filter(f => f.endsWith(".svg"));
		for (const f of svgs) copyFileSync(join(srcIcons, f), join(ICONS_OUT, f));
		console.log(`copied ${svgs.length} SVGs -> fileicons/icons/colorful/`);

		const theme = JSON.parse(readFileSync(srcTheme, "utf8"));
		const rewritten = rewriteIconPaths(theme);
		console.log(`rewrote ${rewritten} icon paths`);

		verifyPaths(theme, "colorful");
		writeFileSync(THEME_OUT, JSON.stringify(theme, null, 2) + "\n", "utf8");
		console.log(`wrote fileicons/xbox-icon-theme-colorful.json (${Object.keys(theme.iconDefinitions).length} icon definitions)`);

		// Derive the Xbox-green duotone set + theme from the colorful one.
		buildGreen(theme, svgs);

		console.log(`\nDone. Remember to update THIRD-PARTY-NOTICES.md if the version changed (vendored v${version}).`);
	} finally {
		rmSync(work, { recursive: true, force: true });
	}
}

main().catch(err => {
	console.error("build-icon-theme failed:", err.message);
	process.exit(1);
});
