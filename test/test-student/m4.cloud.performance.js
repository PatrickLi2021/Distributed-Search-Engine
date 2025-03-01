const { performance } = require('perf_hooks');
const distribution = require('../../config');
const crypto = require('crypto');

const NUM_ENTRIES = 1000;

// Helper function to generate a random string key
const generateRandomKey = () => crypto.randomBytes(8).toString('hex');

// Utility function to generate a random object
const generateRandomObject = () => ({
    first: crypto.randomUUID(),
    second: generateRandomKey(),
});

// Generate 1000 key-value pairs and store them in an in-memory structure
const localStore = new Map();
for (let i = 0; i < NUM_ENTRIES; i++) {
    const key = generateRandomKey();
    const value = generateRandomObject();
    localStore.set(key, value);
}

// Insert all objects and measure performance
function insertKeys () {
    const start = performance.now();
    for (const [key, value] of localStore) {
        distribution.mygroup.mem.put(value, key, (e, v) => {
            if (e) {
                console.log("Error putting key");
            }
        });
    };
    const end = performance.now();

    const latency = (end - start) / NUM_ENTRIES; // Average latency per insert (ms)
    const throughput = NUM_ENTRIES / ((end - start) / 1000); // Inserts per second

    console.log(`Insertion Latency: ${latency.toFixed(4)} ms per operation`);
    console.log(`Insertion Throughput: ${throughput.toFixed(2)} operations/sec`);
};

// Step 3: Retrieve all objects and measure performance
const retrieveKeys = async () => {
    const start = performance.now();
    const retrievePromises = [];

    for (const key of localStore.keys()) {
            distribution.mygroup.mem.get(key, (e, v) => {
                if (e) {
                    console.error(`Retrieval error for key ${key}:`, e);
                } else if (!v) {
                    console.warn(`Missing value for key ${key}`);
                }
                resolve();
            });
        };
    const end = performance.now();

    const latency = (end - start) / NUM_ENTRIES;
    const throughput = NUM_ENTRIES / ((end - start) / 1000);

    console.log(`Retrieval Latency: ${latency.toFixed(4)} ms per operation`);
    console.log(`Retrieval Throughput: ${throughput.toFixed(2)} operations/sec`);
};

// Run benchmark
function runTest() {
    insertKeys();
    retrieveKeys();
};

runTest();
