#!/bin/bash

# Combine terms to create  n-grams (for n=1,2,3) and then count and sort them
# Usage: ./combine.sh <terms > n-grams

input=$(cat)
node c/combine.js "$input"