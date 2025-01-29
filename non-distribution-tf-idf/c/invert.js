const url = process.argv[2];
const docSize = process.argv[3];
const firstLine = docSize.split('\n')[0].trim();
const terms = process.argv[4];

const countOccurrences = (terms, url) => {
  const termArray = terms.split('\n')
      .map((term) => term.trim())
      .filter((term) => term !== '');

  const termCounts = {};

  // Count occurrences of each term
  termArray.forEach((term) => {
    termCounts[term] = (termCounts[term] || 0) + 1;
  });

  // Remove terms with a count of 0
  for (const term in termCounts) {
    if (termCounts[term] === 0) {
      delete termCounts[term];
    }
  }

  // Format the output string, ignoring terms with zero count
  const formattedOutput = Object.entries(termCounts)
      .map(([term, count]) => `${term} | ${count / Number(docSize)} | ${url}`)
      .join('\n');

  return formattedOutput;
};

console.log(countOccurrences(terms, url));
