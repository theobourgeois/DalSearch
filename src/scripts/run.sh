#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
(cd node && npm install)
# Paths are relative to cwd (src/scripts), not the node/ package dir
node node/processing.js ../../database/ -d -l -no-cache
cd py && python3 get_all_profs.py
