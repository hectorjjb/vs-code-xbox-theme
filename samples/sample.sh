#!/usr/bin/env bash
# Xbox theme release helper — Bash sample
set -euo pipefail

readonly EXTENSION_ID="hector-jimenez.xbox-theme"
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DIST_DIR="${REPO_ROOT}/dist"

log()   { printf "\033[32m[xbox]\033[0m %s\n" "$*"; }
fatal() { printf "\033[31m[xbox]\033[0m %s\n" "$*" >&2; exit 1; }

require_cmd() {
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null 2>&1 || fatal "missing required tool: $cmd"
  done
}

build_themes() {
  log "Building themes..."
  pushd "$REPO_ROOT" >/dev/null
  npm run build
  npm run validate
  popd >/dev/null
}

package_vsix() {
  local version
  version="$(jq -r '.version' "${REPO_ROOT}/package.json")"
  [[ -n "$version" ]] || fatal "could not read version"

  mkdir -p "$DIST_DIR"
  log "Packaging xbox-theme v${version}..."
  npx vsce package --out "${DIST_DIR}/xbox-theme-${version}.vsix"

  cat <<-EOF
	---------------------------------------------
	Built: ${DIST_DIR}/xbox-theme-${version}.vsix
	Install locally with:
	  code --install-extension ${DIST_DIR}/xbox-theme-${version}.vsix
	---------------------------------------------
EOF
}

main() {
  require_cmd npm npx jq
  build_themes
  package_vsix
  log "Done!"
}

main "$@"
