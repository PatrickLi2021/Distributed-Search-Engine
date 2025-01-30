#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

term="abil"

cat ../"$T_FOLDER"/d/tf1.txt > d/global-index.txt


if $DIFF <(./../query.js "$term") <(cat ../"$T_FOLDER"/d/tf2.txt) >&2;
then
    echo "$0 success: search results are identical"
    exit 0
else
    echo "$0 failure: search results are not identical"
    exit 1
fi