#!/bin/sh
# Builds v2 course page variants (one per tab, plus light overview) and screenshots them.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
python3 - "$DIR" <<'PY'
import sys
d = sys.argv[1]
src = open(f"{d}/v3.src.html").read().replace("{{SPRITE}}", open(f"{d}/phosphor-sprite.txt").read())
for theme, tab in (("dark", "overview"), ("dark", "schedule"), ("dark", "reviews"), ("light", "overview"), ("light", "schedule"), ("light", "reviews")):
    name = f"v3-{tab}" + ("-light" if theme == "light" else "")
    open(f"{d}/{name}.html", "w").write(src.replace("{{THEME}}", theme).replace("{{TAB}}", tab))
PY
shot() {
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1440,"$2" --virtual-time-budget=10000 \
    --screenshot="$DIR/$1.png" "file://$DIR/$1.html" 2>/dev/null
  echo "$DIR/$1.png"
}
shot v3-overview "${H_OVERVIEW:-1500}"
shot v3-schedule "${H_SCHEDULE:-1300}"
shot v3-reviews "${H_REVIEWS:-1400}"
shot v3-overview-light "${H_OVERVIEW:-1500}"
shot v3-schedule-light "${H_SCHEDULE:-1300}"
shot v3-reviews-light "${H_REVIEWS:-1400}"
