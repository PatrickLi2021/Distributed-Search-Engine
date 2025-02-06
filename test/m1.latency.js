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
serializeTester(5);
serializeTester(5);
serializeTester(5);
serializeTester(5);
const endTime = performance.now();
console.log(`Average Workload Time: ${(endTime - startTime).toFixed(4) / 5} ms`);

// Test for Workload 2 (serializing and deserializing functions)
const startTime2 = performance.now();
serializeTester((a, b) => a + b);
serializeTester((a, b) => a + b);
serializeTester((a, b) => a + b);
serializeTester((a, b) => a + b); 
serializeTester((a, b) => a + b);
const endTime2 = performance.now();
console.log(`Average Workload Time: ${(endTime2 - startTime2).toFixed(4) / 5} ms`);

// Test for Workload 3 (serializing and deserializing complex, recursive structures)
const startTime3 = performance.now();
serializeTester({a: 1, b: 2, c: 3, d: 4});
serializeTester({a: 1, b: 2, c: 3, d: 4});
serializeTester({a: 1, b: 2, c: 3, d: 4});
serializeTester({a: 1, b: 2, c: 3, d: 4}); 
const endTime3 = performance.now();
console.log(`Average Workload Time: ${(endTime3 - startTime3).toFixed(4) / 4} ms`);

test('placeholder test', () => {
  expect(1).toBe(1);
});