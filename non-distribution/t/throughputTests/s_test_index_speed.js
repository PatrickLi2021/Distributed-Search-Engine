#!/usr/bin/env node

const { exec } = require("child_process");
const { performance } = require("perf_hooks");

const scriptPath = "../../index.sh";
const content = "../../d/content.txt"; 
const url = "https://cs.brown.edu/courses/csci1380/sandbox/1/level_1c/index.html";

const start = performance.now();

exec(`${scriptPath} ${content} ${url}`, (error, stdout, stderr) => {
  const end = performance.now();
  console.log(`Execution time: ${(end - start).toFixed(2)} ms`);
});
