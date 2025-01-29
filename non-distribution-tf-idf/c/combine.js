const fs = require('fs');
const path = require('path');

function generateNGrams(terms, n) {
  const nGrams = [];
  for (let i = 0; i <= terms.length - n; i++) {
    nGrams.push(terms.slice(i, i + n).join(' ')); // Join n-gram terms as a single string
  }
  return nGrams;
}

function countAndSort(nGramsArray) {
  const counts = nGramsArray.reduce((acc, nGram) => {
    acc[nGram] = (acc[nGram] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .flatMap(([nGram, count]) => {
        return Array(count).fill(nGram);
      });
}

const input = process.argv[2];
const outputFile = path.join(__dirname, '../t/d/test.txt');

const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {recursive: true});
}

// Split the input into words
const words = input.split(/\s+/).slice(1);

const oneGrams = countAndSort(generateNGrams(words, 1));
const twoGrams = countAndSort(generateNGrams(words, 2));
const threeGrams = countAndSort(generateNGrams(words, 3));

// console.error("one grams: ", oneGrams);
// console.error("two grams: ", twoGrams);
// console.error("three grams: ", threeGrams);
const combinedArray = oneGrams.concat(twoGrams, threeGrams);

const secondArg = process.argv[2];
const firstLine = secondArg.split('\n')[0].trim();
console.log(firstLine);

combinedArray.forEach((nGram) => {
  console.log(nGram);
});
