# !bin/bash
node node/processing.js ../../database/ -d -l
cd py && python get_all_profs.py
