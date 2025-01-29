#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cat "d/merge1.txt" | ./../c/merge.js d/global-index.txt > d/temp-global-index.txt

if DIFF_PERCENT=$DIFF_PERCENT ./gi-diff.js <(sort d/temp-global-index.txt) <(sort "d/merge2.txt") >&2;
then
    echo "$0 success: global indexes are identical"
    exit 0
else
    echo "$0 failure: global indexes are not identical"
    exit 1
fi
