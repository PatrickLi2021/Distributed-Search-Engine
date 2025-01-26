const fs = require('fs');
const path = require('path');

// Stopwords file (same as in your process.sh)
const stopwordsFile = path.join(__dirname, '../d', 'stopwords.txt');

// Read the stopwords file into a Set for fast lookup
const stopwords = new Set(fs.readFileSync(stopwordsFile, 'utf-8').split('\n').map((word) => word.trim()));

// Function to process input
function processInput(input) {
  return input
  // Convert to lowercase
      .toLowerCase()
  // Remove non-letter characters and punctuation, keep spaces and newlines
      .replace(/[^a-zA-Z\s\n]/g, ' ')
  // Remove digits
      .replace(/\d+/g, '')
  // Replace non-alphabetic characters with spaces (if they were not already removed)
      .replace(/[^a-zA-Z\s]+/g, ' ')
  // Normalize any remaining whitespace
      .replace(/\s+/g, ' ')
      .split('\n')
      .map((word) => word.trim())
  // Remove empty lines and stopwords
      .filter((word) => word.length > 0 && !stopwords.has(word));
}

// Function to read input from a file and process it
function processFile(inputFilePath, outputFilePath) {
  try {
    // Read input file
    const input = fs.readFileSync(inputFilePath, 'utf-8');

    // Process the input
    const processed = processInput(input);

    // Write the output to the specified file
    fs.writeFileSync(outputFilePath, processed.join('\n'), 'utf-8');

    console.log(`Processing completed. Output written to: ${outputFilePath}`);
  } catch (error) {
    console.error('Error processing file:', error.message);
  }
}

// Example usage
const inputFile = process.argv[2]; // Input file path from command line argument
const outputFile = process.argv[3]; // Output file path from command line argument
console.log(inputFile);
console.log(outputFile);

if (!inputFile || !outputFile) {
  console.error('Error');
  process.exit(1);
}

processFile(inputFile, outputFile);
