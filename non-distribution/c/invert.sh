#!/bin/bash

# Invert index to create a mapping from a term to all URLs containing the term.

# Usage: ./invert.sh url < n-grams

input=$(cat)
node c/invert.js "$1" "$input"
