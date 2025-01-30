#!/usr/bin/env node

const {exec} = require('child_process');
const {performance} = require('perf_hooks');

const scriptPath = '../../crawl.sh';
const inputURL = '../../d/urls.txt';

const start = performance.now();

exec(`${scriptPath} ${inputURL}`, (error, stdout, stderr) => {
  const end = performance.now();
  console.log(`Execution time: ${(end - start).toFixed(2)} ms`);
});
