const { performance } = require('perf_hooks');
const distribution = require('../../config');
const id = distribution.util.id;

const NUM_ENTRIES = 1000;
jest.setTimeout(400000);

const localStore = {};

const generateKey = () => {
  const timestamp = Date.now().toString(36); 
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomSuffix}`;
};

const generateObject = () => ({
  id: generateKey(),
  name: `Object-${Math.floor(Math.random() * 1000)}`,
  active: Math.random() > 0.5,
  createdAt: new Date().toISOString(),
});

while (Object.keys(localStore).length < 1000) {
  localStore[generateKey()] = generateObject();
}

test('(1 pts) timing insert', (done) => {
  done();
});

test('(1 pts) timing insert', (done) => {
  let insertionCount = 0;
  let queryCount = 0;
  let insertionStart = performance.now();
  for (const key of Object.keys(localStore)) {
    distribution.mygroup.mem.put(localStore[key], localStore, (e, v) => {
      insertionCount += 1;
      if (insertionCount == NUM_ENTRIES) {
        console.log("Insertion Time: " + (performance.now() - insertionStart) + " ms");

        let queryStart = performance.now();
        for (const key of Object.keys(localStore)) {
          distribution.mygroup.mem.get(key, (e, v) => {
            queryCount += 1;
            if (queryCount === NUM_ENTRIES) {
              console.log("Query Time: " + (performance.now() - queryStart) + " ms");
              done();
            }
          });
        }
      }
    });
  }
});

// Node setup for distributed environment
const n1 = { ip: '3.144.113.49', port: 1234 };
const n2 = { ip: '3.16.81.232', port: 1234 };
const n3 = { ip: '3.143.205.85', port: 1234 };
const mygroupGroup = {};

beforeAll((done) => {
    mygroupGroup[id.getSID(n1)] = n1;
    mygroupGroup[id.getSID(n2)] = n2;
    mygroupGroup[id.getSID(n3)] = n3;

    distribution.local.groups.put('mygroup', mygroupGroup, (e, v) => {
        done();
    });
});

afterAll((done) => {
    done();
});