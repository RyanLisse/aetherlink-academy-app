#!/usr/bin/env bash
# Re-render the Workshop 5 diagrams into apps/web/public/workshop-5/ (2048×1100, Academy-dark).
#   tools/workshop-5-diagrams/render.sh             # all
#   tools/workshop-5-diagrams/render.sh gate agenda # some
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../apps/web/public/workshop-5"
chrome="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
all="intent contract plan brief agent terminal gate loop linevsloop bottleneck loopArrows agenda shifts"

source_of() { # name → "page?query output.png"
  case "$1" in
    intent|contract|plan|brief|agent|terminal|gate|loop) echo "visual.html?v=$1 $1-dark.png" ;;
    linevsloop) echo "diagrams.html?d=linevsloop line-vs-loop-dark.png" ;;
    bottleneck) echo "diagrams.html?d=bottleneck bottleneck-dark.png" ;;
    loopArrows) echo "diagrams.html?d=loopArrows loop-arrows-dark.png" ;;
    agenda)     echo "diagrams.html?d=agenda agenda-dark.png" ;;
    shifts)     echo "diagrams.html?d=shifts shifts-dark.png" ;;
    *) echo "unknown diagram: $1 (known: $all)" >&2; return 1 ;;
  esac
}

for name in ${*:-$all}; do
  spec="$(source_of "$name")" || exit 1
  read -r page file <<<"$spec"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=2048,1100 --virtual-time-budget=1500 \
    --screenshot="$out/$file" "file://$here/$page" >/dev/null 2>&1
  test -s "$out/$file" || { echo "render failed: $file" >&2; exit 1; }
  echo "rendered $file"
done
