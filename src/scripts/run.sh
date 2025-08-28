# !bin/bash
node node/processing.js ../../database/ -d -l -no-cache
cd py && python3 get_all_profs.py
