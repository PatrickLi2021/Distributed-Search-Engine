const fs = require('fs');
const path = require('path');

const stopwordsFile = path.join(__dirname, '../d', 'stopwords.txt');
const stopwords = new Set(fs.readFileSync(stopwordsFile, 'utf-8').split('\n').map((word) => word.trim()));

function processInput(input) {
  return input
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word) => word.trim())
      .filter((word) => word.length > 0 && !stopwords.has(word));
}

const input = process.argv[2];
const processedInput = processInput(input);
processedInput.forEach((word) => {
  console.log(word);
});
