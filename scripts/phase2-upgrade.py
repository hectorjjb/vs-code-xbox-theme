#!/usr/bin/env python3
"""
Phase 2 upgrade for the Xbox VS Code theme.

What this does (idempotent — safe to re-run):
  1) Adds missing modern workbench color keys to both themes, palette-mapped.
     Existing values are NEVER overwritten — only missing keys are filled in.
  2) Adds `semanticHighlighting: true` and a baseline `semanticTokenColors` block.
  3) De-duplicates `tokenColors` rules whose scopes collide (keeps first occurrence,
     drops scopes already covered earlier).
  4) Copies missing TextMate scope rules from dark -> light so language coloring
     parity is restored. Colors are remapped via a dark->light palette table.
  5) Pretty-prints both files with tab indentation. `colors` and
     `semanticTokenColors` are written sorted alphabetically (matches existing
     style). `tokenColors` order is preserved.
"""

from __future__ import annotations
import json, sys, copy, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DARK = ROOT / "themes" / "xbox-dark.color-theme.json"
LIGHT = ROOT / "themes" / "xbox-light.color-theme.json"

DARK_P = {
    "bg":            "#272822",
    "bgAlt":         "#3b3c35",
    "bgDeep":        "#1d1e19",
    "bgDeeper":      "#161613",
    "fg":            "#fdfff1",
    "fgMid":         "#c0c1b5",
    "fgDim":         "#919288",
    "fgDimmer":      "#57584f",
    "green":         "#107c10",
    "greenHover":    "#0e6a0e",
    "greenBright":   "#a6e22e",
    "greenNeon":     "#9bf00b",
    "red":           "#f92672",
    "orange":        "#e3641a",
    "orangeBright":  "#fd971f",
    "yellow":        "#ffd800",
    "blue":          "#66d9ef",
    "blueDeep":      "#2972d1",
    "lightBlue":     "#83e7fb",
    "purple":        "#ae81ff",
    "alphaLow":      "#fdfff10c",
    "alphaMed":      "#fdfff126",
    "alphaHigh":     "#fdfff140",
    "shadow":        "#000000aa",
    "transparent":   "#00000000",
}

LIGHT_P = {
    "bg":            "#ffffff",
    "bgAlt":         "#f3f3f3",
    "bgDeep":        "#ececec",
    "bgDeeper":      "#dddddd",
    "fg":            "#333333",
    "fgMid":         "#4e4e4e",
    "fgDim":         "#717171",
    "fgDimmer":      "#a0a0a0",
    "green":         "#107c10",
    "greenHover":    "#0e6a0e",
    "greenBright":   "#5dc21e",
    "greenNeon":     "#388a34",
    "red":           "#a31515",
    "orange":        "#e3641a",
    "orangeBright":  "#d96f00",
    "yellow":        "#a37b00",
    "blue":          "#0062a3",
    "blueDeep":      "#2972d1",
    "lightBlue":     "#0078d4",
    "purple":        "#7c4dff",
    "alphaLow":      "#0000000c",
    "alphaMed":      "#0000001a",
    "alphaHigh":     "#00000033",
    "shadow":        "#a8a8a8",
    "transparent":   "#00000000",
}

MODERN_COLORS: dict[str, str] = {
    "commandCenter.foreground":             "fgMid",
    "commandCenter.activeForeground":       "fg",
    "commandCenter.background":             "bgDeep",
    "commandCenter.activeBackground":       "bgAlt",
    "commandCenter.border":                 "bgDeeper",
    "commandCenter.activeBorder":           "green",
    "commandCenter.inactiveForeground":     "fgDimmer",
    "commandCenter.inactiveBorder":         "bgDeeper",
    "commandCenter.debuggingBackground":    "orange",

    "banner.background":                    "bgAlt",
    "banner.foreground":                    "fg",
    "banner.iconForeground":                "green",

    "editorStickyScroll.background":        "bgDeep",
    "editorStickyScroll.border":            "bgDeeper",
    "editorStickyScroll.shadow":            "shadow",
    "editorStickyScrollGutter.background":  "bgDeep",
    "editorStickyScrollHover.background":   "bgAlt",

    "panelStickyScroll.background":         "bgDeep",
    "panelStickyScroll.border":             "bgDeeper",
    "panelStickyScroll.shadow":             "shadow",

    "sideBarStickyScroll.background":       "bgDeep",
    "sideBarStickyScroll.border":           "bgDeeper",
    "sideBarStickyScroll.shadow":           "shadow",

    "terminalStickyScroll.background":      "bgDeep",
    "terminalStickyScroll.border":          "bgDeeper",
    "terminalStickyScrollHover.background": "bgAlt",

    "editorInlayHint.background":           "alphaLow",
    "editorInlayHint.foreground":           "fgDim",
    "editorInlayHint.typeBackground":       "alphaLow",
    "editorInlayHint.typeForeground":       "fgMid",
    "editorInlayHint.parameterBackground":  "alphaLow",
    "editorInlayHint.parameterForeground":  "fgDim",

    "editorGhostText.foreground":           "fgDim",
    "editorGhostText.background":           "transparent",
    "editorGhostText.border":               "transparent",

    "editorBracketPairGuide.background1":   "greenNeon",
    "editorBracketPairGuide.background2":   "lightBlue",
    "editorBracketPairGuide.background3":   "yellow",
    "editorBracketPairGuide.background4":   "orange",
    "editorBracketPairGuide.background5":   "purple",
    "editorBracketPairGuide.background6":   "red",
    "editorBracketPairGuide.activeBackground1": "greenBright",
    "editorBracketPairGuide.activeBackground2": "blue",
    "editorBracketPairGuide.activeBackground3": "yellow",
    "editorBracketPairGuide.activeBackground4": "orangeBright",
    "editorBracketPairGuide.activeBackground5": "purple",
    "editorBracketPairGuide.activeBackground6": "red",

    "editorBracketHighlight.unexpectedBracket.foreground": "red",

    "testing.iconFailed":                   "red",
    "testing.iconErrored":                  "orange",
    "testing.iconPassed":                   "greenBright",
    "testing.iconQueued":                   "yellow",
    "testing.iconUnset":                    "fgDim",
    "testing.iconSkipped":                  "fgDimmer",
    "testing.peekBorder":                   "green",
    "testing.peekHeaderBackground":         "bgAlt",
    "testing.message.error.decorationForeground": "red",
    "testing.message.error.lineBackground":       "alphaLow",
    "testing.message.info.decorationForeground":  "fgDim",
    "testing.message.info.lineBackground":        "alphaLow",
    "testing.runAction":                    "green",
    "testing.coveredBackground":            "alphaLow",
    "testing.coveredBorder":                "greenBright",
    "testing.coveredGutterBackground":      "greenBright",
    "testing.uncoveredBackground":          "alphaLow",
    "testing.uncoveredBorder":              "orange",
    "testing.uncoveredGutterBackground":    "orange",
    "testing.uncoveredBranchBackground":    "orange",

    "terminalCommandDecoration.defaultBackground": "fgDim",
    "terminalCommandDecoration.successBackground": "greenBright",
    "terminalCommandDecoration.errorBackground":   "red",
    "terminalOverviewRuler.cursorForeground":      "green",
    "terminalOverviewRuler.findMatchForeground":   "yellow",

    "terminal.findMatchBackground":         "alphaHigh",
    "terminal.findMatchBorder":             "green",
    "terminal.findMatchHighlightBackground":"alphaMed",
    "terminal.findMatchHighlightBorder":    "transparent",
    "terminal.tab.activeBorder":            "green",
    "terminal.dropBackground":              "alphaMed",

    "profileBadge.background":              "green",
    "profileBadge.foreground":              "fg",
    "profiles.sashBorder":                  "bgDeeper",

    "multiDiffEditor.headerBackground":     "bgAlt",
    "multiDiffEditor.background":           "bg",
    "multiDiffEditor.border":               "bgDeeper",

    "mergeEditor.change.background":             "alphaLow",
    "mergeEditor.change.word.background":        "alphaMed",
    "mergeEditor.changeBase.background":         "alphaLow",
    "mergeEditor.changeBase.word.background":    "alphaMed",
    "mergeEditor.conflict.unhandledUnfocused.border": "red",
    "mergeEditor.conflict.unhandledFocused.border":   "red",
    "mergeEditor.conflict.handledUnfocused.border":   "green",
    "mergeEditor.conflict.handledFocused.border":     "greenBright",
    "mergeEditor.conflict.handled.minimapOverViewRuler":   "green",
    "mergeEditor.conflict.unhandled.minimapOverViewRuler": "red",
    "mergeEditor.conflictingLines.background":            "alphaLow",

    "scmGraph.foreground1":                 "greenBright",
    "scmGraph.foreground2":                 "lightBlue",
    "scmGraph.foreground3":                 "yellow",
    "scmGraph.foreground4":                 "orange",
    "scmGraph.foreground5":                 "purple",
    "scmGraph.historyItemRefColor":         "greenBright",
    "scmGraph.historyItemRemoteRefColor":   "lightBlue",
    "scmGraph.historyItemBaseRefColor":     "orange",
    "scmGraph.historyItemHoverLabelForeground": "fg",
    "scmGraph.historyItemHoverDefaultLabelForeground": "fg",
    "scmGraph.historyItemHoverDefaultLabelBackground": "bgAlt",

    "scm.providerBorder":                   "bgDeeper",
    "scm.historyItemAdditionsForeground":   "greenBright",
    "scm.historyItemDeletionsForeground":   "red",
    "scm.historyItemStatisticsBorder":      "bgDeeper",

    "actionBar.toggledBackground":          "alphaMed",
    "toolbar.hoverBackground":              "alphaMed",
    "toolbar.hoverOutline":                 "transparent",
    "toolbar.activeBackground":             "alphaHigh",

    "commentsView.resolvedIcon":            "fgDim",
    "commentsView.unresolvedIcon":          "green",
    "editorCommentsWidget.replyInputBackground": "bgAlt",
    "editorCommentsWidget.resolvedBorder":       "fgDim",
    "editorCommentsWidget.unresolvedBorder":     "green",
    "editorCommentsWidget.rangeBackground":      "alphaLow",
    "editorCommentsWidget.rangeActiveBackground":"alphaMed",

    "ports.iconRunningProcessForeground":   "greenBright",

    "welcomePage.tileBackground":           "bgAlt",
    "welcomePage.tileHoverBackground":      "bgDeep",
    "welcomePage.tileBorder":               "bgDeeper",
    "welcomePage.progress.background":      "bgAlt",
    "welcomePage.progress.foreground":      "green",
    "walkthrough.stepTitle.foreground":     "fg",

    "editorWatermark.foreground":           "fgDimmer",

    "debugView.exceptionLabelBackground":   "red",
    "debugView.exceptionLabelForeground":   "fg",
    "debugView.stateLabelBackground":       "green",
    "debugView.stateLabelForeground":       "fg",
    "debugView.valueChangedHighlight":      "yellow",
    "debugTokenExpression.name":            "lightBlue",
    "debugTokenExpression.value":           "fg",
    "debugTokenExpression.string":          "greenBright",
    "debugTokenExpression.boolean":         "purple",
    "debugTokenExpression.number":          "orange",
    "debugTokenExpression.error":           "red",

    "keybindingTable.headerBackground":     "bgAlt",
    "keybindingTable.rowsBackground":       "bg",

    "tree.tableColumnsBorder":              "bgDeeper",
    "tree.tableOddRowsBackground":          "alphaLow",
    "tree.inactiveIndentGuidesStroke":      "fgDimmer",

    "list.dropBetweenBackground":           "green",

    "interactive.activeCodeBorder":         "green",
    "interactive.inactiveCodeBorder":       "bgDeeper",

    "notebookEditorOverviewRuler.runningCellForeground": "greenBright",
    "notebookStatusSuccessIcon.foreground": "greenBright",
    "notebookStatusErrorIcon.foreground":   "red",
    "notebookStatusRunningIcon.foreground": "yellow",
    "notebookScrollbarSlider.background":   "alphaLow",
    "notebookScrollbarSlider.hoverBackground": "alphaMed",
    "notebookScrollbarSlider.activeBackground":"alphaHigh",
    "notebook.cellEditorBackground":        "bgDeep",
    "notebook.symbolHighlightBackground":   "alphaLow",
    "notebook.cellInsertionIndicator":      "green",
    "notebook.outputContainerBorderColor":  "bgDeeper",
    "notebook.outputContainerBackgroundColor": "bgDeep",

    "extensionIcon.starForeground":         "yellow",
    "extensionIcon.verifiedForeground":     "greenBright",
    "extensionIcon.preReleaseForeground":   "orange",
    "extensionIcon.sponsorForeground":      "purple",
    "mcpIcon.starForeground":               "yellow",

    "settings.focusedRowBorder":            "green",
    "settings.rowHoverBackground":          "alphaLow",
    "settings.focusedRowBackground":        "alphaLow",
    "settings.settingsHeaderHoverForeground": "fg",

    "chat.requestBackground":               "alphaLow",
    "chat.requestBorder":                   "bgDeeper",
    "chat.requestBubbleBackground":         "bgAlt",
    "chat.requestBubbleHoverBackground":    "bgDeep",
    "chat.requestCodeBorder":               "bgDeeper",
    "chat.slashCommandBackground":          "green",
    "chat.slashCommandForeground":          "fg",
    "chat.avatarBackground":                "green",
    "chat.avatarForeground":                "fg",
    "chat.editedFileForeground":            "orange",
    "chat.linesAddedForeground":            "greenBright",
    "chat.linesRemovedForeground":          "red",
    "chat.thinkingShimmer":                 "greenBright",
    "chat.checkpointSeparator":             "bgDeeper",
    "inlineChat.background":                "bgAlt",
    "inlineChat.border":                    "green",
    "inlineChat.foreground":                "fg",
    "inlineChat.shadow":                    "shadow",
    "inlineChatInput.background":           "bgDeep",
    "inlineChatInput.border":               "bgDeeper",
    "inlineChatInput.focusBorder":          "green",
    "inlineChatInput.placeholderForeground":"fgDim",
    "inlineChatDiff.inserted":              "alphaLow",
    "inlineChatDiff.removed":               "alphaLow",

    "inlineEdit.modifiedBackground":        "alphaLow",
    "inlineEdit.modifiedBorder":            "green",
    "inlineEdit.modifiedChangedLineBackground": "alphaLow",
    "inlineEdit.modifiedChangedTextBackground": "alphaMed",
    "inlineEdit.originalBackground":        "alphaLow",
    "inlineEdit.originalBorder":            "fgDim",
    "inlineEdit.originalChangedLineBackground": "alphaLow",
    "inlineEdit.originalChangedTextBackground": "alphaMed",
    "inlineEdit.gutterIndicator.background":           "transparent",
    "inlineEdit.gutterIndicator.primaryBackground":    "green",
    "inlineEdit.gutterIndicator.primaryBorder":        "greenBright",
    "inlineEdit.gutterIndicator.primaryForeground":    "fg",
    "inlineEdit.gutterIndicator.secondaryBackground":  "bgAlt",
    "inlineEdit.gutterIndicator.secondaryBorder":      "fgDim",
    "inlineEdit.gutterIndicator.secondaryForeground":  "fgMid",
    "inlineEdit.gutterIndicator.successfulBackground": "greenBright",
    "inlineEdit.gutterIndicator.successfulBorder":     "green",
    "inlineEdit.gutterIndicator.successfulForeground": "fg",
    "inlineEdit.tabWillAcceptModifiedBorder": "greenBright",
    "inlineEdit.tabWillAcceptOriginalBorder": "green",

    "statusBarItem.errorForeground":        "fg",
    "statusBarItem.warningBackground":      "orange",
    "statusBarItem.warningForeground":      "fg",
    "statusBarItem.offlineBackground":      "fgDimmer",
    "statusBarItem.offlineForeground":      "fg",
    "statusBarItem.focusBorder":            "green",
    "statusBarItem.compactHoverBackground": "alphaMed",

    "diffEditor.insertedLineBackground":    "alphaLow",
    "diffEditor.removedLineBackground":     "alphaLow",
    "diffEditor.border":                    "bgDeeper",
    "diffEditor.diagonalFill":              "alphaLow",
    "diffEditor.unchangedRegionBackground": "bgDeep",
    "diffEditor.unchangedRegionForeground": "fgDim",
    "diffEditor.unchangedCodeBackground":   "bg",
    "diffEditor.move.border":               "purple",
    "diffEditor.moveActive.border":         "purple",

    "minimap.infoHighlight":                "lightBlue",
    "minimap.chatEditHighlight":            "green",

    "editorOverviewRuler.inlineChatInserted": "greenBright",
    "editorOverviewRuler.inlineChatRemoved":  "red",
    "editorOverviewRuler.commentForeground":  "fgDim",
    "editorOverviewRuler.commentUnresolvedForeground": "green",

    "editor.foldPlaceholderForeground":     "fgDim",
    "editor.linkedEditingBackground":       "alphaLow",
    "editor.inlineValuesBackground":        "alphaLow",
    "editor.inlineValuesForeground":        "fgDim",
    "editor.wordHighlightTextBackground":   "alphaLow",

    "menu.background":                      "bgAlt",
    "menu.foreground":                      "fg",
    "menu.selectionBackground":             "green",
    "menu.selectionForeground":             "fg",
    "menu.selectionBorder":                 "transparent",
    "menu.separatorBackground":             "bgDeeper",
    "menu.border":                          "bgDeeper",

    "quickInputList.focusBackground":       "green",
    "quickInputList.focusForeground":       "fg",
    "quickInputList.focusIconForeground":   "fg",

    "editorGroup.dropIntoPromptBackground": "bgAlt",
    "editorGroup.dropIntoPromptForeground": "fg",
    "editorGroup.dropIntoPromptBorder":     "green",

    "tab.selectedBackground":               "bgAlt",
    "tab.selectedForeground":               "fg",
    "tab.selectedBorderTop":                "green",
    "tab.lastPinnedBorder":                 "fgDim",
    "tab.dragAndDropBorder":                "green",
}

SEMANTIC: dict[str, dict | str] = {
    "namespace":            "lightBlue",
    "class":                {"foreground": "greenBright", "bold": True},
    "interface":            "lightBlue",
    "enum":                 "yellow",
    "enumMember":           "orange",
    "type":                 "lightBlue",
    "typeParameter":        "yellow",
    "parameter":            "fg",
    "variable":             "fg",
    "variable.readonly":    "orange",
    "property":             "fg",
    "property.readonly":    "orange",
    "function":             "greenBright",
    "method":               "greenBright",
    "macro":                "purple",
    "decorator":            "purple",
    "event":                "yellow",
    "string":               "yellow",
    "number":               "purple",
    "keyword":              "red",
    "*.deprecated":         {"strikethrough": True},
    "*.declaration":        {"bold": True},
    "comment.documentation":"fgDim",
}

DARK_TO_LIGHT_REMAP = {
    "#fdfff1":  LIGHT_P["fg"],
    "#c0c1b5":  LIGHT_P["fgMid"],
    "#919288":  LIGHT_P["fgDim"],
    "#57584f":  LIGHT_P["fgDimmer"],
    "#a6e22e":  LIGHT_P["greenBright"],
    "#9bf00b":  LIGHT_P["greenNeon"],
    "#107c10":  LIGHT_P["green"],
    "#f92672":  LIGHT_P["red"],
    "#fd971f":  LIGHT_P["orangeBright"],
    "#e3641a":  LIGHT_P["orange"],
    "#ffd800":  LIGHT_P["yellow"],
    "#e6db74":  LIGHT_P["yellow"],
    "#66d9ef":  LIGHT_P["lightBlue"],
    "#83e7fb":  LIGHT_P["lightBlue"],
    "#ae81ff":  LIGHT_P["purple"],
    "#272822":  LIGHT_P["bg"],
    "#3b3c35":  LIGHT_P["bgAlt"],
    "#161613":  LIGHT_P["bgDeeper"],
    "#1d1e19":  LIGHT_P["bgDeep"],
}

def resolve(palette: dict, role_or_color: str) -> str:
    if role_or_color.startswith("#"):
        return role_or_color
    return palette.get(role_or_color, role_or_color)

def fill_missing_colors(theme: dict, palette: dict) -> int:
    added = 0
    for k, role in MODERN_COLORS.items():
        if k in theme["colors"]:
            continue
        theme["colors"][k] = resolve(palette, role)
        added += 1
    return added

def add_semantic(theme: dict, palette: dict) -> None:
    theme["semanticHighlighting"] = True
    out = {}
    for k, v in SEMANTIC.items():
        if isinstance(v, dict):
            entry = dict(v)
            if "foreground" in entry:
                entry["foreground"] = resolve(palette, entry["foreground"])
            out[k] = entry
        else:
            out[k] = resolve(palette, v)
    theme["semanticTokenColors"] = out

def _scope_list(scope):
    if scope is None: return []
    if isinstance(scope, list): return scope
    if isinstance(scope, str):
        return [s.strip() for s in scope.split(",")] if "," in scope else [scope]
    return []

def dedupe_token_colors(theme: dict) -> int:
    seen: set[str] = set()
    kept = []
    removed = 0
    for rule in theme["tokenColors"]:
        scopes = _scope_list(rule.get("scope"))
        if not scopes:
            kept.append(rule)
            continue
        new_scopes = [s for s in scopes if s not in seen]
        if not new_scopes:
            removed += 1
            continue
        new_rule = copy.deepcopy(rule)
        new_rule["scope"] = new_scopes if len(new_scopes) > 1 else new_scopes[0]
        kept.append(new_rule)
        for s in new_scopes:
            seen.add(s)
    theme["tokenColors"] = kept
    return removed

def remap_settings_for_light(settings: dict) -> dict:
    out = dict(settings)
    for k in ("foreground", "background"):
        if k in out and isinstance(out[k], str) and out[k].lower() in DARK_TO_LIGHT_REMAP:
            out[k] = DARK_TO_LIGHT_REMAP[out[k].lower()]
    return out

def existing_scope_set(theme: dict) -> set:
    s = set()
    for r in theme["tokenColors"]:
        for sc in _scope_list(r.get("scope")):
            s.add(sc)
    return s

def backport_scopes(dark: dict, light: dict) -> int:
    light_scopes = existing_scope_set(light)
    appended = 0
    for rule in dark["tokenColors"]:
        scopes = _scope_list(rule.get("scope"))
        if not scopes:
            continue
        missing = [s for s in scopes if s not in light_scopes]
        if not missing:
            continue
        new_rule = copy.deepcopy(rule)
        new_rule["scope"] = missing if len(missing) > 1 else missing[0]
        if "settings" in new_rule and isinstance(new_rule["settings"], dict):
            new_rule["settings"] = remap_settings_for_light(new_rule["settings"])
        light["tokenColors"].append(new_rule)
        for s in missing:
            light_scopes.add(s)
        appended += 1
    return appended

def write_theme(path: pathlib.Path, theme: dict) -> None:
    ordered = {}
    for k in ("$schema", "type"):
        if k in theme:
            ordered[k] = theme[k]
    if "semanticHighlighting" in theme:
        ordered["semanticHighlighting"] = theme["semanticHighlighting"]
    if "semanticTokenColors" in theme:
        ordered["semanticTokenColors"] = {
            k: theme["semanticTokenColors"][k]
            for k in sorted(theme["semanticTokenColors"])
        }
    ordered["colors"] = {k: theme["colors"][k] for k in sorted(theme["colors"])}
    ordered["tokenColors"] = theme["tokenColors"]
    txt = json.dumps(ordered, indent="\t", ensure_ascii=False)
    path.write_text(txt + "\n", encoding="utf-8")

def main() -> int:
    dark  = json.loads(DARK.read_text())
    light = json.loads(LIGHT.read_text())

    print(f"BEFORE  dark: colors={len(dark['colors'])} tokenColors={len(dark['tokenColors'])}")
    print(f"BEFORE light: colors={len(light['colors'])} tokenColors={len(light['tokenColors'])}")

    da = fill_missing_colors(dark, DARK_P)
    la = fill_missing_colors(light, LIGHT_P)
    print(f"added modern color keys -> dark:+{da}, light:+{la}")

    add_semantic(dark, DARK_P)
    add_semantic(light, LIGHT_P)
    print("added semanticHighlighting + semanticTokenColors to both themes")

    dr = dedupe_token_colors(dark)
    lr = dedupe_token_colors(light)
    print(f"deduped token color rules -> dark:-{dr}, light:-{lr}")

    ba = backport_scopes(dark, light)
    print(f"backported scope rules dark->light: +{ba}")

    print(f"AFTER   dark: colors={len(dark['colors'])} tokenColors={len(dark['tokenColors'])}")
    print(f"AFTER  light: colors={len(light['colors'])} tokenColors={len(light['tokenColors'])}")

    write_theme(DARK, dark)
    write_theme(LIGHT, light)
    print("wrote both themes (tab-indented, colors sorted)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
