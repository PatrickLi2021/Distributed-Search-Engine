#!/bin/bash

mkdir -p debug

# Process input and save the output
c/process.sh < "$1" | tee debug/output_of_process.txt

doc_size=$(tail -n 1 debug/output_of_process.txt)

echo "$doc_size"

cat debug/output_of_process.txt | head -n -1 | tee debug/input_to_stem.txt |
  c/stem.js "$doc_size" | tee debug/output_of_stem.txt |
  c/combine.sh "$doc_size" | tee debug/output_of_combine.txt

tail -n +2 debug/output_of_combine.txt | c/invert.sh "$2" "$doc_size" | tee debug/output_of_invert.txt

# Pass output_of_invert.txt to merge.js
cat debug/output_of_invert.txt | c/merge.js d/global-index.txt | tee debug/output_of_merge.txt |
  sort -o d/global-index.txt
