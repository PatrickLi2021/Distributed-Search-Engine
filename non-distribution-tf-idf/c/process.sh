#!/bin/bash

input=$(cat)

# Capture the document size
if [[ "$(pwd)" =~ /t$ ]]; then
    doc_size=$(node ../c/process.js "$input" | tee debug/output_of_process.txt | tail -n 1)
else
    doc_size=$(node c/process.js "$input" | tee debug/output_of_process.txt | tail -n 1)
fi


