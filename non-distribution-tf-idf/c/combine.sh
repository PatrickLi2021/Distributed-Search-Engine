#!/bin/bash

input=$(cat)

if [[ "$(pwd)" =~ /t$ ]]; then
    doc_size=$(node ../c/combine.js "$input" | tee debug/output_of_combine.txt | tail -n 1)
else
    doc_size=$(node c/combine.js "$input" | tee debug/output_of_combine.txt | tail -n 1)
fi