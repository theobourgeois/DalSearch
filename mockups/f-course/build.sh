#!/bin/sh
# Builds course.html (dark) and course-light.html from course.src.html, then screenshots both.
# Usage: sh build.sh [height]
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
H="${1:-1700}"
python3 - "$DIR" <<'EOF'
import sys
d = sys.argv[1]
src = open(f"{d}/course.src.html").read()
sprite = open(f"{d}/phosphor-sprite.txt").read()
for theme, out in (("dark", "course.html"), ("light", "course-light.html")):
    open(f"{d}/{out}", "w").write(src.replace("{{SPRITE}}", sprite).replace("{{THEME}}", theme))
EOF
for f in course course-light; do
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=1440,"$H" --virtual-time-budget=10000 \
    --screenshot="$DIR/$f.png" "file://$DIR/$f.html" 2>/dev/null
  echo "$DIR/$f.png"
done
