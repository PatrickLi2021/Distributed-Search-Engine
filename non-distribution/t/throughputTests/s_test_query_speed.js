#!/usr/bin/env node

const { exec } = require("child_process");
const { performance } = require("perf_hooks");

const query = "../../query.js";
const term = "stuff"

start = performance.now();
exec(`${query} ${term}`, (error, stdout, stderr) => {
  exec(`${query} ${term}`, (error, stdout, stderr) => {
    const end = performance.now();
    console.log(`Execution time query: ${(end - start).toFixed(2)} ms`);
  });
});