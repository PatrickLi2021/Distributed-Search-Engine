#!/bin/bash

# Invert index to create a mapping from a term to all URLs containing the term.

# Usage: ./invert.sh url < n-grams

input=$(cat)

# Check if the current working directory ends with "/t"
if [[ "$(pwd)" =~ /t$ ]]; then
    node ../c/invert.js "$1" "$input"
else
    node c/invert.js "$1" "$input"
fi
