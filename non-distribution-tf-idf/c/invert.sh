#!/bin/bash

# Invert index to create a mapping from a term to all URLs containing the term.

# Usage: ./invert.sh url < n-grams

input=$(cat)

if [[ "$(pwd)" =~ /t$ ]]; then
    node ../c/invert.js "$1" "$2" "$input"
else
    node c/invert.js "$1" "$2" "$input"
fi
