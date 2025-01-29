#!/bin/bash
INPUT=$(cat)
if [[ "$(pwd)" =~ /t$ ]]; then
    cat | node ../c/process.js "$INPUT"
else
    cat | node c/process.js "$INPUT"
fi
