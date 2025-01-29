# M0: Setup & Centralized Computing

> Add your contact information below and in `package.json`.

* name: `Patrick Li`

* email: `patrick_li@brown.edu`

* cslogin: `pli46`


## Summary
The core part of my implementation involved completing the following 6 files: `stem.js`, `getText.js`, `getURLs.js`, `process.sh`, `merge.js`, and `query.js`. 

- For `stem.js`, I used the `PorterStemmer` from the `natural` library in JavaScript to stem each line of input. Similarly, for `getText.js`, I used the `convert` function in JavaScript to convert the HTML DOM structure into plaintext. 
- For `getURLs.txt`, first, it retrieves a base URL from the command-line argument (process.argv) and ensures that it ends with a `/`. It then reads the HTML content line by line from `stdin` using the readline module. After collecting the HTML, the script parses it into a DOM structure using `jsdom` and selects all anchor (<a>) elements with an `href` attribute. It then extracts the URL from each anchor and prints the absolute URL, combining the base URL with the relative URL found in the `href` attribute.
- For `process.sh`, it processes text input by converting it to lowercase, removing punctuation and non-alphabetical characters, and filtering out digits. It normalizes the text by converting it to ASCII and handling special characters. Then, it splits the text into individual words, removes stopwords (defined in a specified file), and eliminates empty lines, leaving only meaningful terms. The implementation features many regular expressions to handle parsing and filtering out unwanted characters.
- `merge.js`merges a local inverted index with an existing global index. It reads the local index from standard input and the global index from a specified file. The local index contains word-frequency-url triplets, while the global index stores terms with associated URLs and frequencies. The script merges the two indices by appending the local index data to the global index, sorting entries by frequency in descending order. After merging, the updated global index is printed to the console in the same format as the input files.
- The querier allows users to search an inverted index file for a given set of terms. It processes the query by stemming, removing stopwords, and normalizing the input, then constructs a search query. The script searches the global index file using grep and prints the matching lines, or an error message if no matches are found.

The most challenging aspects of this implementation were understanding the flow of the search engine as well as figuring out how to write Bash scripts and integrate them into the pipeline, since I don't have previous experience working with Bash or shell scripting.

## Correctness & Performance Characterization
To characterize correctness, we developed `8` that test the following cases.


*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.


## Wild Guess
I think that it will take around 1500 lines of code to build the fully distributed, scalable version of the search engine. The reason that I think this is because a lot more support has to be added to incorporate features like sharding, partitioning, etc. Additionally, many more lines have to be added to perhaps support concurrent operations. In total, I think more than 1000 lines will be added to this implementation, so I'll guess around 1500 as a ballpark estimate.