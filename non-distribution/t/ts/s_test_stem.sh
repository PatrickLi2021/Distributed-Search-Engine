#!/bin/bash

# Define folder variables with proper defaults
T_FOLDER=${T_FOLDER:-../..}
R_FOLDER=${R_FOLDER:-}

# Change directory to the parent of the current script directory
cd "$(dirname "$0")/$R_FOLDER" || exit 1

# Define the diff tool (default is 'diff')
DIFF=${DIFF:-diff}

# Check if the stemmed words in stem1.txt match those in stem2.txt after processing
if $DIFF <(cat "$T_FOLDER/d/stem1.txt" | ./c/stem.js | sort) <(sort "$T_FOLDER/d/stem2.txt") >&2;
then
    echo "$0 success: stemmed words are identical"
    exit 0
else
    echo "$0 failure: stemmed words are not identical"
    exit 1
fi
