#!/bin/bash

input=$(cat)

if [[ "$(pwd)" =~ /t$ ]]; then
    node ../c/process.js "$input"
else
    node c/process.js "$input"
fi
