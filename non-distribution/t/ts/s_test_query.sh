#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1
echo "Current working directory: $(pwd)"

DIFF=${DIFF:-diff}

term="stuff"

cat "d/query1.txt" > d/global-index.txt
QUERY_JS="../query.js"

if $DIFF <("$QUERY_JS" "$term") <(cat "d/query2.txt") >&2;
then
    echo "$0 success: search results are identical"
    exit 0
else
    echo "$0 failure: search results are not identical"
    exit 1
fi
