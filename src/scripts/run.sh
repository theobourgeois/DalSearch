# !bin/bash
node node/processing.js ../../database/ -d -l -no-cache
cd py && python get_all_profs.py
