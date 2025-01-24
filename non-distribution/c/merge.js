#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: cat input | ./merge.js global-index > output
Sample Command: cat ../t/d/m1.txt | ./merge.js global-index > ../d/global-index.txt

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is be formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
*/

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});
// 1. Read the incoming local index data from standard input (stdin) line by line.
let localIndex = '';
rl.on('line', (line) => {
  localIndex += line + '\n';
});

rl.on('close', () => {
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
  const globalIndexName = process.argv[2];
  const globalIndexPath = path.resolve(globalIndexName);
  const globalIndexData = fs.readFileSync(globalIndexPath, 'utf8');

  // If there's an error with filename, create error and call printMerged
  if (globalIndexName == null || globalIndexPath.slice(-4) != '.txt') {
    const err = new Error('file invalid');
    printMerged(err, globalIndexData);
  }

  // Otherwise, call printMerged with no error
  printMerged(null, globalIndexData);
});

const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');
  // console.log(localIndexLines)
  // console.log(globalIndexLines);

  localIndexLines.pop();
  globalIndexLines.pop();

  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object where keys are terms and values contain `url` and `freq`.
  for (const line of localIndexLines) {
    const term = line.split('|')[0].trim();
    const freq = line.split('|')[1].trim();
    const url = line.split('|')[2].trim();
    local[term] = {url, freq};
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object where keys are terms and values are arrays of `url` and `freq` objects.
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    const [term, urlFreqData] = line.split(' | ');
    const urlFreqPairs = urlFreqData.split(' ');

    const urlFreqList = [];
    for (let i = 0; i < urlFreqPairs.length; i += 2) {
      const url = urlFreqPairs[i];
      const freq = parseInt(urlFreqPairs[i + 1], 10);
      urlFreqList.push({url, freq}); // Array of {url, freq} objects
    }

    if (term in global) {
      global[term].push(urlFreqList);
    } else {
      global[term] = urlFreqList;
    }
  }

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Append the local index entry to the array of entries in the global index.
  //     - Sort the array by `freq` in descending order.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  for (const term in local) {
    if (term in global) {
      global[term].push({url: local[term].url, freq: local[term].freq});
      global[term].sort(compare);
    } else {
      global[term] = [{url: local[term].url, freq: local[term].freq}];
    }
  }
  for (const term in global) {
    const url = global[term][0].url;
    const freq = global[term][0].freq;
    console.log(term + ' | ' + url + ' ' + freq);
  }
  // TODO?: After you're done creating the current global index, we need to write it back to the file
  // so that the file contains the updated global index
};
