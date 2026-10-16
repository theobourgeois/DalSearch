#!/bin/sh
# Usage: sh shot.sh <page> <height>   e.g. sh shot.sh home 1300
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1440,"$2" --virtual-time-budget=10000 \
  --screenshot="$DIR/$1.png" "file://$DIR/$1.html" 2>/dev/null
echo "$DIR/$1.png"
