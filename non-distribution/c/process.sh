#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Commands that will be useful: tr, iconv, grep

stopwords_file="d/stopwords.txt"

cat - | tr '[:upper:]' '[:lower:]' | tr '[:punct:]' ' ' | tr -cd '[:alpha:] \n' | iconv -f utf-8 -t ascii//TRANSLIT | sed 's/[0-9]\+//g' | sed 's/\[.*\]/&/g' | sed 's/\[\([^]]*\)\]/\1/g' |  tr ' ' '\n' | grep -v -w -f "$stopwords_file" | grep -v "^\s*$"

