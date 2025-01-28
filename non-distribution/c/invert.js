const URL = process.argv[2];
const terms = process.argv[3];

const countOccurrences = (terms, url) => {
  const termArray = terms.split('\n')
      .map((term) => term.trim())
      .filter((term) => term !== '');

  const termCounts = {};
  termArray.forEach((term) => {
    termCounts[term] = (termCounts[term] || 0) + 1;
  });

  const formattedOutput = Object.entries(termCounts)
      .map(([term, count]) => `${term} | ${count} | ${url}`)
      .join('\n');

  return formattedOutput;
};

console.log(countOccurrences(terms, URL));
