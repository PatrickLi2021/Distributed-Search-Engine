const { serialize, deserialize } = require("../distribution/util/serialization");
const { performance } = require("perf_hooks");

// Test function
function serializeTester(workload) {
    const serialized = serialize(workload);
    deserialize(serialized);
  }

// Test for Workload 1 (serializing and deserializing base types)
const startTime = performance.now();
serializeTester(5);
serializeTester(false);
serializeTester(null);
serializeTester(undefined);
serializeTester("test string");
const endTime = performance.now();
console.log(`Average Workload Time: ${(endTime - startTime).toFixed(4) / 5} ms`);

// Test for Workload 2 (serializing and deserializing functions)
const startTime2 = performance.now();
serializeTester((a, b) => a + b);
serializeTester((str) => str.toUpperCase());
serializeTester((arr) => arr.map(x => x * 2));
serializeTester((a, b) => a * b); 
serializeTester((a, b) => a / b);
const endTime2 = performance.now();
console.log(`Average Workload Time: ${(endTime2 - startTime2).toFixed(4) / 5} ms`);

// Test for Workload 3 (serializing and deserializing complex, recursive structures)
const startTime3 = performance.now();
serializeTester({a: 1, b: 2, c: 3});
serializeTester([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
serializeTester([1, 2, 3, "HI", {d: 4, e: 5, f: 6}, false, null]);
serializeTester({a: {a: 1, b: 2, c: 3}, b: 2, c: 3}); 
const endTime3 = performance.now();
console.log(`Average Workload Time: ${(endTime3 - startTime3).toFixed(4) / 4} ms`);