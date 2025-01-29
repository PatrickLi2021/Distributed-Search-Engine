#!/bin/bash
T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

# Use relative paths for the files
GETTEXT1="../t/d/getText1.txt"
GETTEXT2="../t/d/getText2.txt"
GETTEXT_JS="../c/getText.js"

if $DIFF <(cat "$GETTEXT1" | "$GETTEXT_JS" | sort) <(sort "$GETTEXT2") >&2;
then
    echo "$0 success: texts are identical"
    exit 0
else
    echo "$0 failure: texts are not identical"
    exit 1
fi
