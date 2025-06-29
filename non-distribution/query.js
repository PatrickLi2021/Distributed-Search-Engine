#!/usr/bin/env node

/*
Search the inverted index for a particular (set of) terms.
Usage: ./query.js your search terms

The behavior of this JavaScript file should be similar to the following shell pipeline:
grep "$(echo "$@" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  ")" d/global-index.txt

Here is one idea on how to develop it:
1. Read the command-line arguments using `process.argv`. A user can provide any string to search for.
2. Normalize, remove stopwords from and stem the query string — use already developed components
3. Search the global index using the processed query string.
4. Print the matching lines from the global index file.

Examples:
./query.js A     # Search for "A" in the global index. This should return all lines that contain "A" as part of an 1-gram, 2-gram, or 3-gram.
./query.js A B   # Search for "A B" in the global index. This should return all lines that contain "A B" as part of a 2-gram, or 3-gram.
./query.js A B C # Search for "A B C" in the global index. This should return all lines that contain "A B C" as part of a 3-gram.

Note: Since you will be removing stopwords from the search query, you will not find any matches for words in the stopwords list.

The simplest way to use existing components is to call them using execSync.
For example, `execSync(`echo "${input}" | ./c/process.sh`, {encoding: 'utf-8'});`
*/


// const fs = require('fs');
const {execSync} = require('child_process');
const path = require('path');

function query(indexFile, args) {
  const input = args.join(' ');
  const relativePath = path.relative(process.cwd(), __dirname);
  let stemScript = ''; let processScript = ''; let curPath = '';
  if (relativePath == '') {
    stemScript = path.join(relativePath, 'c/stem.js');
    processScript = path.join(relativePath, 'c/process.sh');
    curPath = path.join('', indexFile);
  } else {
    stemScript = path.join(relativePath, 'c/stem.js');
    processScript = path.join(relativePath, 'c/process.sh');
    curPath = path.join('../', indexFile);
  }

  // Stem and process args
  const processedOutput = execSync(
      `echo "${input}" | ${stemScript} | ${processScript}`,
      {encoding: 'utf-8'},
  );
  const processedTerms = processedOutput.trim().split('\n');

  // Read the index file
  // const indexData = fs.readFileSync(indexFile, 'utf-8');
  // const indexLines = indexData.split('\n');

  // Build a regular expression from the processed terms
  const searchQuery = processedTerms.join(' ');
  const grepCommand = `grep -i "${searchQuery}" ${curPath}`;
  // const queryRegex = new RegExp(`\\b${searchQuery}\\b`, 'i');

  // Search for matching lines in the index file
  try {
    // Execute grep command to search for matching lines in the index file
    const result = execSync(grepCommand, {encoding: 'utf-8'});

    // Output the matching lines (from the grep result)
    console.log(result.trim());
  } catch (error) {
    // If grep returns an error (e.g., no matches), log the error
    console.error('No matches found or error occurred:', error.message);
  }
}

const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

const indexFile = 'd/global-index.txt'; // Path to the global index file
query(indexFile, args);
