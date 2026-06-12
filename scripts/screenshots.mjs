#!/usr/bin/env node
/**
 * Deterministic theme screenshot generator.
 *
 * Renders a realistic VS Code workbench mock for every theme variant — plus a
 * palette swatch sheet (every named role + hex) and a file-icon before/after —
 * then captures fixed-size PNGs with a headless Chromium (Playwright).
 *
 * Everything is driven directly from the built `themes/*.json` color maps,
 * `src/palette.json` roles, and the bundled `fileicons/` SVGs + Shiki syntax
 * highlighting, so re-running after a palette change reproduces identical
 * framing and sizing every time.
 *
 * Usage:
 *   npm run build            # ensure themes/*.json are current
 *   npm run screenshots      # writes the committed README assets in images/
 *
 * Output (committed, consumed by README.md):
 *   images/<theme>.png          — workbench mock per variant (xbox-360.png, …)
 *   images/<theme>-palette.png  — palette swatch sheet per variant
 *   images/icons-default.png    — file tree with built-in (default) icons
 *   images/icons-colorful.png   — file tree with the XBOX Icons Colorful theme
 *   images/icons-green.png      — file tree with the XBOX Icons Green theme
 *
 * These are clean, reproducible mocks — not pixel-identical to a real VS Code
 * capture — and regenerate with identical framing/sizing on every run.
 */

import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createHighlighter } from "shiki";
import { VARIANTS } from "./variants.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "images");
const ICON_THEME = resolve(ROOT, "fileicons/xbox-icon-theme-colorful.json");
const GREEN_ICON_THEME = resolve(ROOT, "fileicons/xbox-icon-theme-green.json");
const SCALE = 2;

const LABELS = {
	one: "XBOX ONE",
	xbox360: "XBOX 360",
	seriesX: "XBOX Series X",
	ogXbox: "Original Xbox",
	hcDark: "XBOX High Contrast",
	hcLight: "XBOX High Contrast Light",
};
const SAMPLE = { file: "sample.ts", lang: "typescript" };
const ACTIVE_LINE = 12;

const TREE = [
	{ name: "src", id: "_fd_src_open", depth: 0, folder: true, open: true },
	{ name: "app.ts", id: "_f_typescript", depth: 1, active: true },
	{ name: "App.tsx", id: "_f_reactts", depth: 1 },
	{ name: "server.js", id: "_f_js", depth: 1 },
	{ name: "styles.css", id: "_f_css", depth: 1 },
	{ name: "tests", id: "_fd_test", depth: 0, folder: true },
	{ name: "main.py", id: "_f_python", depth: 0 },
	{ name: "main.go", id: "_f_go", depth: 0 },
	{ name: "query.sql", id: "_f_sql", depth: 0 },
	{ name: "index.html", id: "_f_html", depth: 0 },
	{ name: "config.yaml", id: "_f_yaml", depth: 0 },
	{ name: "Dockerfile", id: "_f_docker", depth: 0 },
	{ name: "package.json", id: "_f_npm", depth: 0 },
	{ name: "README.md", id: "_f_markdown", depth: 0 },
	{ name: ".gitignore", id: "_f_git", depth: 0 },
];

const loadJSON = (p) => JSON.parse(readFileSync(p, "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svgDataUri(iconPath) {
	const abs = resolve(dirname(ICON_THEME), iconPath.replace(/^\.\//, ""));
	return "data:image/svg+xml;base64," + Buffer.from(readFileSync(abs, "utf8")).toString("base64");
}

function workbenchHTML(theme, label, codeHtml, mapping) {
	const c = theme.colors;
	const g = (k, fb) => c[k] ?? fb;
	const editorBg = g("editor.background", "#1e1e1e");
	const editorFg = g("editor.foreground", "#cccccc");
	const border = g("editorGroup.border", g("contrastBorder", "#00000033"));
	const accent = g("focusBorder", g("activityBarBadge.background", g("button.background", "#0a0")));

	const fileImg = (t, cls = "ico") => {
		const def = mapping.iconDefinitions[t.id]
			?? mapping.iconDefinitions[t.folder ? mapping.folder : mapping.file];
		return def ? `<img class="${cls}" src="${svgDataUri(def.iconPath)}">` : "";
	};

	const rows = TREE.map((t) => {
		const pad = 8 + t.depth * 12;
		const active = t.active;
		const hover = t.name === "main.py";
		const bg = active ? g("list.activeSelectionBackground", "#094771")
			: hover ? g("list.hoverBackground", "transparent") : "transparent";
		const fg = active ? g("list.activeSelectionForeground", editorFg) : g("sideBar.foreground", editorFg);
		const chev = t.folder
			? `<span class="chev">${t.open ? "\u25be" : "\u25b8"}</span>` : `<span class="chev"></span>`;
		return `<div class="row" style="padding-left:${pad}px;background:${bg};color:${fg}">${chev}${fileImg(t)}<span class="lbl">${esc(t.name)}</span></div>`;
	}).join("");

	const tab = (name, id, active) => {
		const tfg = active ? g("tab.activeForeground", editorFg) : g("tab.inactiveForeground", editorFg);
		const tbg = active ? g("tab.activeBackground", editorBg) : g("tab.inactiveBackground", editorBg);
		const top = active ? `border-top:1px solid ${g("tab.activeBorderTop", accent)};` : "border-top:1px solid transparent;";
		return `<div class="tab" style="background:${tbg};color:${tfg};${top}border-right:1px solid ${g("tab.border", border)}">
			${fileImg({ id, folder: false }, "tico")}<span>${esc(name)}</span>
			<span class="x">${active ? "\u25cf" : "\u00d7"}</span></div>`;
	};

	// Minimap: a few rows of faux code blocks tinted from the syntax palette.
	const miniPalette = [g("terminal.ansiGreen", accent), editorFg, g("terminal.ansiBlue", "#69f"),
		g("terminal.ansiYellow", "#dd0"), g("terminal.ansiMagenta", "#c6c")];
	const mini = Array.from({ length: 34 }, (_, i) => {
		const segs = 1 + ((i * 7) % 4);
		let html = `<div class="mline" style="margin-left:${(i % 5) * 4}px">`;
		for (let s = 0; s < segs; s++) {
			const w = 6 + ((i * 3 + s * 11) % 26);
			const col = miniPalette[(i + s) % miniPalette.length];
			html += `<span style="width:${w}px;background:${col}"></span>`;
		}
		return html + "</div>";
	}).join("");

	const ansi = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"]
		.map((n) => `<span style="color:${g("terminal.ansiBright" + n, g("terminal.ansi" + n, editorFg))}">\u2588</span>`).join("");

	const statusRemote = g("statusBarItem.remoteBackground", accent);
	const statusRemoteFg = g("statusBarItem.remoteForeground", g("statusBar.foreground", "#fff"));

	const lineHi = g("editor.lineHighlightBackground", "transparent");
	const lineHiBorder = g("editor.lineHighlightBorder", "transparent");
	const selBg = g("editor.selectionBackground", "#264f78");

	return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"Segoe UI",system-ui,sans-serif}
.win{width:1240px;height:780px;display:flex;flex-direction:column;overflow:hidden;font-size:13px;border-radius:8px;
  border:1px solid ${border};box-shadow:0 18px 50px #00000066}
.titlebar{height:36px;display:flex;align-items:center;gap:8px;padding:0 12px;flex:0 0 auto;
  background:${g("titleBar.activeBackground", editorBg)};color:${g("titleBar.activeForeground", editorFg)};
  border-bottom:1px solid ${g("titleBar.border", border)}}
.dots{display:flex;gap:8px}.dot{width:12px;height:12px;border-radius:50%}
.title{margin:0 auto;font-size:12.5px;opacity:.85}
.body{flex:1;display:flex;min-height:0}
.activity{width:50px;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:20px;padding:12px 0;
  background:${g("activityBar.background", editorBg)};border-right:1px solid ${g("activityBar.border", "transparent")}}
.activity .grp{display:flex;flex-direction:column;gap:20px;align-items:center}
.activity .spacer{flex:1}
.aitem{position:relative;width:50px;display:flex;justify-content:center}
.aitem svg{width:24px;height:24px;fill:none;stroke:${g("activityBar.inactiveForeground", g("activityBar.foreground", editorFg))};stroke-width:1.5;opacity:.8}
.aitem.on svg{stroke:${g("activityBar.foreground", editorFg)};opacity:1}
.aitem.on::before{content:"";position:absolute;left:0;top:-12px;bottom:-12px;width:2px;background:${g("activityBar.activeBorder", accent)}}
.aitem .bdg{position:absolute;top:-6px;right:8px;min-width:16px;height:16px;border-radius:8px;font-size:9px;
  display:flex;align-items:center;justify-content:center;padding:0 4px;
  background:${g("activityBarBadge.background", accent)};color:${g("activityBarBadge.foreground", "#fff")}}
.sidebar{width:250px;flex:0 0 auto;display:flex;flex-direction:column;
  background:${g("sideBar.background", editorBg)};border-right:1px solid ${g("sideBar.border", "transparent")}}
.sbtitle{padding:11px 16px 6px;font-size:11px;letter-spacing:.1em;
  color:${g("sideBarTitle.foreground", g("sideBar.foreground", editorFg))};display:flex;justify-content:space-between}
.sbsection{padding:4px 8px 4px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;display:flex;align-items:center;gap:4px;
  background:${g("sideBarSectionHeader.background", "transparent")};color:${g("sideBarSectionHeader.foreground", g("sideBar.foreground", editorFg))}}
.tree{overflow:hidden}
.row{height:22px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.chev{width:10px;display:inline-block;text-align:center;font-size:9px;opacity:.8}
.ico{width:16px;height:16px}.lbl{overflow:hidden;text-overflow:ellipsis}
.main{flex:1;display:flex;flex-direction:column;min-width:0;background:${editorBg}}
.tabs{height:36px;display:flex;flex:0 0 auto;background:${g("editorGroupHeader.tabsBackground", editorBg)};
  border-bottom:1px solid ${g("editorGroupHeader.tabsBorder", g("tab.border", border))}}
.tab{display:flex;align-items:center;gap:7px;padding:0 12px;font-size:12.5px}
.tab .tico{width:15px;height:15px}.tab .x{font-size:10px;opacity:.7;margin-left:4px}
.breadcrumb{height:25px;display:flex;align-items:center;padding:0 18px;gap:5px;font-size:11.5px;flex:0 0 auto;
  color:${g("breadcrumb.foreground", editorFg)};background:${g("breadcrumb.background", editorBg)}}
.editor{flex:1;display:flex;overflow:hidden;min-height:0;position:relative}
.gutter{padding:10px 12px 0 14px;text-align:right;flex:0 0 auto;font-family:"SF Mono",Menlo,Consolas,monospace;
  font-size:12.5px;line-height:1.55;color:${g("editorLineNumber.foreground", "#888")};user-select:none;position:relative;z-index:2}
.gutter .cur{color:${g("editorLineNumber.activeForeground", editorFg)};font-weight:600}
.code{flex:1;overflow:hidden;position:relative;z-index:2}
.code pre{margin:0;padding:10px 0 0 0!important;background:transparent!important;
  font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:1.55}
.code pre code{display:block}
.code .line{display:inline-block;width:100%;padding:0 16px}
.code .line:nth-child(${ACTIVE_LINE}){background:${lineHi};box-shadow:inset 0 0 0 1px ${lineHiBorder}}
.code .line:nth-child(4){box-shadow:inset 0 0 0 9999px ${selBg}}
.minimap{width:74px;flex:0 0 auto;padding:10px 6px;overflow:hidden;border-left:1px solid ${border};
  background:${g("minimap.background", editorBg)}}
.mline{display:flex;gap:2px;height:5px;margin-bottom:3px}
.mline span{display:inline-block;height:2.5px;opacity:.55;border-radius:1px}
.panel{height:148px;flex:0 0 auto;display:flex;flex-direction:column;
  background:${g("panel.background", editorBg)};border-top:1px solid ${g("panel.border", border)}}
.ptabs{height:30px;display:flex;align-items:center;gap:18px;padding:0 18px;flex:0 0 auto;font-size:11px;letter-spacing:.05em;
  border-bottom:1px solid ${g("panel.border", "transparent")}}
.ptab{text-transform:uppercase;color:${g("panelTitle.inactiveForeground", editorFg)};padding:7px 0;opacity:.8}
.ptab.on{color:${g("panelTitle.activeForeground", editorFg)};opacity:1;border-bottom:1px solid ${g("panelTitle.activeBorder", accent)}}
.term{flex:1;padding:9px 18px;font-family:"SF Mono",Menlo,Consolas,monospace;font-size:12px;line-height:1.6;
  color:${g("terminal.foreground", editorFg)}}
.term .prompt{color:${g("terminal.ansiGreen", accent)}}
.term .ansi{display:flex;gap:3px;margin-top:6px;font-size:15px}
.status{height:24px;display:flex;align-items:center;font-size:11.5px;flex:0 0 auto;
  background:${g("statusBar.background", editorBg)};color:${g("statusBar.foreground", editorFg)}}
.status .seg{display:flex;align-items:center;gap:5px;padding:0 9px;height:100%}
.status .remote{background:${statusRemote};color:${statusRemoteFg}}
.status .spacer{flex:1}
</style></head><body>
<div class="win">
  <div class="titlebar">
    <div class="dots"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span></div>
    <div class="title">${esc(SAMPLE.file)} — xbox-theme — ${esc(label)}</div>
  </div>
  <div class="body">
    <div class="activity">
      <div class="grp">
        <div class="aitem on"><svg viewBox="0 0 24 24"><path d="M4 3h9l4 4v14H4z"/><path d="M13 3v4h4"/></svg></div>
        <div class="aitem"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg></div>
        <div class="aitem"><svg viewBox="0 0 24 24"><circle cx="7" cy="6" r="2.5"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="9" r="2.5"/><path d="M7 8.5v7M9.5 6.5h5M17 11.5c0 3-4 2.5-7 4"/></svg><span class="bdg">3</span></div>
        <div class="aitem"><svg viewBox="0 0 24 24"><path d="M5 4l14 8-14 8z"/></svg></div>
        <div class="aitem"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
      </div>
      <div class="spacer"></div>
      <div class="grp">
        <div class="aitem"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></div>
        <div class="aitem"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></div>
      </div>
    </div>
    <div class="sidebar">
      <div class="sbtitle"><span>EXPLORER</span><span>\u22ef</span></div>
      <div class="sbsection"><span class="chev">\u25be</span>XBOX-THEME</div>
      <div class="tree">${rows}</div>
    </div>
    <div class="main">
      <div class="tabs">
        ${tab("sample.ts", "_f_typescript", true)}
        ${tab("styles.css", "_f_css", false)}
        ${tab("README.md", "_f_markdown", false)}
      </div>
      <div class="breadcrumb">${fileImg({ id: "_fd_src" }, "ico")} src &nbsp;\u203a&nbsp; ${fileImg({ id: "_f_typescript" }, "ico")} ${esc(SAMPLE.file)} &nbsp;\u203a&nbsp; AchievementsClient</div>
      <div class="editor">
        <div class="gutter">${Array.from({ length: 28 }, (_, i) => i + 1 === ACTIVE_LINE ? `<span class="cur">${i + 1}</span>` : i + 1).join("<br>")}</div>
        <div class="code">${codeHtml}</div>
        <div class="minimap">${mini}</div>
      </div>
      <div class="panel">
        <div class="ptabs">
          <span class="ptab">Problems</span><span class="ptab">Output</span>
          <span class="ptab">Debug Console</span><span class="ptab on">Terminal</span>
        </div>
        <div class="term"><span class="prompt">\u279c</span> xbox-theme git:(main) npm run build<br>
          built 6 themes \u00b7 733 colors each<div class="ansi">${ansi}</div></div>
      </div>
    </div>
  </div>
  <div class="status">
    <span class="seg remote">\u00bb\u00ab</span>
    <span class="seg">\u2387 main</span><span class="seg">\u21ba</span>
    <span class="seg">\u2715 0 \u26a0 0</span>
    <span class="spacer"></span>
    <span class="seg">Ln ${ACTIVE_LINE}, Col 5</span><span class="seg">Spaces: 2</span>
    <span class="seg">UTF-8</span><span class="seg">LF</span>
    <span class="seg">${fileImg({ id: "_f_typescript" }, "ico")} TypeScript</span>
    <span class="seg">\u2713 Prettier</span><span class="seg">\u2407</span>
  </div>
</div>
</body></html>`;
}

// Swatch sheet of every named palette role for this variant.
function paletteHTML(label, roles, type) {
	const dark = type !== "light";
	const cells = Object.entries(roles).filter(([k]) => k !== "_doc").map(([name, val]) => {
		return `<div class="cell"><span class="sw"><span class="swc" style="background:${val}"></span></span>
			<span class="meta"><span class="nm">$${esc(name)}</span><span class="hx">${esc(val)}</span></span></div>`;
	}).join("");
	const count = Object.keys(roles).filter((k) => k !== "_doc").length;
	const bg = dark ? "#161616" : "#f3f3f3";
	const fg = dark ? "#e0e0e0" : "#222";
	const sub = dark ? "#9a9a9a" : "#666";
	const cardBg = dark ? "#1f1f1f" : "#ffffff";
	const cardBorder = dark ? "#2c2c2c" : "#e0e0e0";
	return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"Segoe UI",system-ui,sans-serif}
.sheet{width:1240px;background:${bg};color:${fg};padding:22px 24px 26px}
.h{display:flex;align-items:baseline;gap:12px;margin-bottom:16px}
.h .t{font-size:17px;font-weight:700}.h .c{font-size:12px;color:${sub}}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.cell{display:flex;align-items:center;gap:9px;padding:6px 8px;border-radius:6px;min-width:0;background:${cardBg};border:1px solid ${cardBorder}}
.sw{width:26px;height:26px;flex:0 0 auto;border-radius:5px;border:1px solid ${cardBorder};overflow:hidden;display:block;position:relative;
  background-image:linear-gradient(45deg,#999 25%,transparent 25%),linear-gradient(-45deg,#999 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#999 75%),linear-gradient(-45deg,transparent 75%,#999 75%);
  background-size:8px 8px;background-position:0 0,0 4px,4px -4px,-4px 0;background-color:#ddd}
.swc{position:absolute;inset:0}
.meta{display:flex;flex-direction:column;min-width:0}
.nm{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hx{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:${sub}}
</style></head><body>
<div class="sheet">
  <div class="h"><span class="t">Palette — ${esc(label)}</span><span class="c">${count} named roles · src/palette.json</span></div>
  <div class="grid">${cells}</div>
</div></body></html>`;
}

function iconTreeHTML(theme, mapping, variant) {
	// variant: "default" (built-in generic icons) | "colorful" | "green"
	const headLabel = { default: "Default", colorful: "XBOX Icons Colorful", green: "XBOX Icons Green" }[variant];
	const c = theme.colors;
	const g = (k, fb) => c[k] ?? fb;
	const bg = g("sideBar.background", "#1e1e1e");
	const fg = g("sideBar.foreground", "#ccc");
	const genericFile = `data:image/svg+xml;base64,${Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="${fg}" d="M9 1H3.5L3 1.5v13l.5.5h9l.5-.5V5L9 1zm0 1.4L11.6 5H9V2.4zM4 14V2h4v4h4v8H4z"/></svg>`
	).toString("base64")}`;
	const genericFolder = `data:image/svg+xml;base64,${Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="${g("list.activeSelectionForeground", fg)}" d="M1.5 3l.5-.5h4l1 1h7l.5.5v9l-.5.5h-12L1 13V3zm1 .5V13h11V5H7.2l-1-1H2.5z"/></svg>`
	).toString("base64")}`;
	const rows = TREE.map((t) => {
		const pad = 8 + t.depth * 14;
		const bgc = t.active ? `background:${g("list.activeSelectionBackground", bg)};` : "";
		const fgc = t.active ? g("list.activeSelectionForeground", fg) : fg;
		const chevron = t.folder
			? `<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><polyline points="${t.open ? "4,6 8,10 12,6" : "6,4 10,8 6,12"}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
			: "";
		let src;
		if (variant === "default") {
			src = t.folder ? genericFolder : genericFile;
		} else {
			const def = mapping.iconDefinitions[t.id]
				?? mapping.iconDefinitions[t.folder ? mapping.folder : mapping.file];
			src = def ? svgDataUri(def.iconPath) : "";
		}
		return `<div class="row" style="padding-left:${pad}px;${bgc}color:${fgc}">
			<span class="chev">${chevron}</span><img class="ico" src="${src}"><span>${esc(t.name)}</span></div>`;
	}).join("");
	return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,"Segoe UI",system-ui,sans-serif}
.panel{width:340px;height:520px;background:${bg};color:${fg};border:1px solid ${g("editorGroup.border", "#0003")};display:flex;flex-direction:column}
.head{padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${g("sideBarTitle.foreground", fg)}}
.row{height:24px;display:flex;align-items:center;gap:7px;font-size:13px;white-space:nowrap}
.chev{width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;opacity:.75}
.ico{width:16px;height:16px}
</style></head><body><div class="panel"><div class="head">Explorer — ${headLabel}</div>${rows}</div></body></html>`;
}

async function main() {
	mkdirSync(OUT_DIR, { recursive: true });
	const mapping = loadJSON(ICON_THEME);
	const paletteDoc = loadJSON(resolve(ROOT, "src/palette.json"));

	const themes = VARIANTS.map(({ key, out }) => {
		const t = loadJSON(resolve(ROOT, out));
		const src = loadJSON(resolve(ROOT, `src/themes/${key}.json`));
		const roles = paletteDoc[key] ?? paletteDoc[src.extends];
		const img = out.replace(/^themes\//, "").replace(/\.color-theme\.json$/, "");
		return {
			key, img, label: LABELS[key] ?? key, roles,
			theme: { ...t, name: key, type: /light/.test(t.type) ? "light" : "dark" },
		};
	});

	const highlighter = await createHighlighter({
		themes: themes.map((t) => t.theme),
		langs: [SAMPLE.lang],
	});

	const code = readFileSync(resolve(ROOT, "samples", SAMPLE.file), "utf8").split("\n").slice(0, 28).join("\n");

	const browser = await chromium.launch();
	const page = await browser.newPage({ deviceScaleFactor: SCALE });

	for (const { key, img, label, theme, roles } of themes) {
		const codeHtml = highlighter.codeToHtml(code, { lang: SAMPLE.lang, theme: key });
		await page.setContent(workbenchHTML(theme, label, codeHtml, mapping), { waitUntil: "networkidle" });
		await (await page.$(".win")).screenshot({ path: resolve(OUT_DIR, `${img}.png`) });
		console.log(`wrote images/${img}.png`);

		await page.setContent(paletteHTML(label, roles, theme.type), { waitUntil: "networkidle" });
		await (await page.$(".sheet")).screenshot({ path: resolve(OUT_DIR, `${img}-palette.png`) });
		console.log(`wrote images/${img}-palette.png`);
	}

	const iconTheme = themes.find((t) => t.key === "one").theme;
	const greenMapping = loadJSON(GREEN_ICON_THEME);
	const iconSets = [
		["icons-default", "default", null],
		["icons-colorful", "colorful", mapping],
		["icons-green", "green", greenMapping],
	];
	for (const [name, variant, map] of iconSets) {
		await page.setContent(iconTreeHTML(iconTheme, map, variant), { waitUntil: "networkidle" });
		await (await page.$(".panel")).screenshot({ path: resolve(OUT_DIR, `${name}.png`) });
		console.log(`wrote images/${name}.png`);
	}

	await browser.close();
	console.log(`\nDone — ${themes.length * 2 + iconSets.length} images in ${OUT_DIR}`);
}

main().catch((err) => {
	console.error("screenshots failed:", err);
	process.exit(1);
});
