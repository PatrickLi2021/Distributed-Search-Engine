const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};
const dlibGroup = {};
const tfidfGroup = {};
const crawlGroup = {};
const urlxtrGroup = {};
const strmatchGroup = {};
const ridxGroup = {};
const rlgGroup = {};


/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test.only('(0 pts) (scenario) all.mr:ncdc', (done) => {
/* Implement the map and reduce functions.
   The map function should parse the string value and return an object with the year as the key and the temperature as the value.
   The reduce function should return the maximum temperature for each year.

   (The implementation for this scenario is provided below.)
*/

  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const out = {};
    out[words[1]] = parseInt(words[3]);
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const dataset = [
    {'000': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
    {'106': '004301199099999 1950 0515120049999999N9 +0022 1+9999'},
    {'212': '004301199099999 1950 0515180049999999N9 -0011 1+9999'},
    {'318': '004301265099999 1949 0324120040500001N9 +0111 1+9999'},
    {'424': '004301265099999 1949 0324180040500001N9 +0078 1+9999'},
  ];

  const expected = [{'1950': 22}, {'1949': 111}];

  const doMapReduce = (cb) => {
    distribution.ncdc.store.get(null, (e, v) => {
      console.log("SCENARIO v: ", v);
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }


      distribution.ncdc.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ncdc.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:dlib', (done) => {
/*
   Implement the map and reduce functions.
   The map function should parse the string value and return an object with the word as the key and the value as 1.
   The reduce function should return the count of each word.
*/

  const mapper = (key, value) => {
    const res = [];
    const words = value.split(/\s+/).filter(Boolean); 
    for (let i = 0; i < words.length; i++) {
      res.push({[words[i]]: 1});
    }
    return res;
  };

  const reducer = (key, values) => {
    let mapping = {};
    mapping[key] = values.reduce((acc, num) => acc + num, 0);
    return mapping;
  };

  const dataset = [
    {'b1-l1': 'It was the best of times, it was the worst of times,'},
    {'b1-l2': 'it was the age of wisdom, it was the age of foolishness,'},
    {'b1-l3': 'it was the epoch of belief, it was the epoch of incredulity,'},
    {'b1-l4': 'it was the season of Light, it was the season of Darkness,'},
    {'b1-l5': 'it was the spring of hope, it was the winter of despair,'},
  ];

  const expected = [
    {It: 1}, {was: 10},
    {the: 10}, {best: 1},
    {of: 10}, {'times,': 2},
    {it: 9}, {worst: 1},
    {age: 2}, {'wisdom,': 1},
    {'foolishness,': 1}, {epoch: 2},
    {'belief,': 1}, {'incredulity,': 1},
    {season: 2}, {'Light,': 1},
    {'Darkness,': 1}, {spring: 1},
    {'hope,': 1}, {winter: 1},
    {'despair,': 1},
  ];

  const doMapReduce = (cb) => {
    distribution.dlib.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.dlib.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.dlib.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:tfidf', (done) => {
/*
    Implement the map and reduce functions.
    The map function should parse the string value and return an object with the word as the key and the document and count as the value.
    The reduce function should return the TF-IDF for each word.
*/

const dataset = [
  {'doc1': 'machine learning is amazing'},
  {'doc2': 'deep learning powers amazing systems'},
  {'doc3': 'machine learning and deep learning are related'},
];

const expected = [
  {'machine': {'doc1': '0.0440', 'doc3': '0.0252'}},
  {'learning': {'doc1': '0.0000', 'doc2': '0.0000', 'doc3': '0.0000'}},
  {'is': {'doc1': '0.1193'}},
  {'amazing': {'doc1': '0.0440', 'doc2': '0.0352'}},
  {'deep': {'doc2': '0.0352', 'doc3': '0.0252'}},
  {'powers': {'doc2': '0.0954'}},
  {'systems': {'doc2': '0.0954'}},
  {'and': {'doc3': '0.0682'}},
  {'are': {'doc3': '0.0682'}},
  {'related': {'doc3': '0.0682'}},
];

const mapper = (key, value) => {
  const words = value.split(" ");
  let counts = {}; 
  let res = [];
  words.forEach(word => {
    counts[word] = (counts[word] || 0) + 1;
  });
  const seenWords = new Set();
  words.forEach(word => {
    if (!seenWords.has(word)) {
      seenWords.add(word);
      res.push({ [word]: { [key]: counts[word] / words.length }});
    }
  });
  return res;
};


  // Reduce function: calculate TF-IDF for each word
  const reducer = (key, values) => {
    let res = [];
    const idf = Math.log10(3 / values.length);
    values.forEach(val => {
      const [[docID, tf]] = Object.entries(val);
      const tfidf = tf * idf;
      const existingEntry = res.find(entry => entry[key]);
      if (!existingEntry) {
        res.push({
          [key]: {
            [docID]: tfidf.toFixed(4)
          }
        });
      } else {
        existingEntry[key][docID] = tfidf.toFixed(4);
      }
    });
    return res;
  };
  
  const doMapReduce = (cb) => {
    distribution.tfidf.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }
      distribution.tfidf.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.tfidf.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
  The rest of the scenarios are left as an exercise.
  For each one you'd like to implement, you'll need to:
  - Define the map and reduce functions.
  - Create a dataset.
  - Run the map reduce.
*/

test('(10 pts) (scenario) all.mr:crawl', (done) => {
    done(new Error('Implement this test.'));
});

test('(10 pts) (scenario) all.mr:urlxtr', (done) => {
  const mapper = (key, value) => {
    const webPages = {
      'doc1': 'Visit <a href="https://example.com/page1">Page 1</a> and <a href="https://example.com/page2">Page 2</a>.',
      'doc2': 'Here is a link to <a href="https://example.com/page2">Page 2</a> again!',
      'doc3': 'Check out <a href="https://example.com/page3">Page 3</a> for details.',
    };
    const urlRegex = /href="(https?:\/\/[^"]+)"/g;
    const content = webPages[value] || '';
    let match;
    const urls = new Set();
    
    while ((match = urlRegex.exec(content)) !== null) {
      urls.add(match[1]);
    }

    // Returning URLs as key-value pairs
    return Array.from(urls).map(url => ({ [url]: 1 }));
  };

  const reducer = (key, values) => {
    // Reducing values to count the occurrences of each URL
    return { [key]: values.length };
  };

  const dataset = [
    { 'doc1': 'doc1' },
    { 'doc2': 'doc2' },
    { 'doc3': 'doc3' },
  ];

  const expected = [
    { 'https://example.com/page1': 1 },
    { 'https://example.com/page2': 2 },
    { 'https://example.com/page3': 1 },
  ];

  const doMapReduce = () => {
    distribution.urlxtr.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.urlxtr.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const pageId = o[key];
    distribution.urlxtr.store.put(pageId, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:strmatch', (done) => {
  const mapper = (key, value) => {
    const regex = /regex/i;
    if (regex.test(value)) {
      return [{ [key]: value }];
    }
    return [];
  };
  
  const reducer = (key, values) => {
    return key;
  };
  
  const dataset = [
    { 'obj1': 'first object' },
    { 'obj2': 'second object' },
    { 'obj3': 'Third object, contains regex' },
    { 'obj4': 'Fourth object, contains regex' },
    { 'obj5': 'Fifth object, contains regex' },
    { 'obj6': 'Sixth object, contains regex' },
  ];
  
  const expected = [
    'obj3',
    'obj4',
    'obj5',
    'obj6',
  ];

  // Test for this scenario
  const doMapReduce = (cb) => {
    distribution.strmatch.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }
      distribution.strmatch.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.strmatch.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:ridx', (done) => {
  const mapper = (key, value) => {
    const words = value.toLowerCase().split(/\s+/);
    return words.map(word => ({ [word]: key })); 
  };
  

  const reducer = (key, values) => {
    const uniqueDocs = [...new Set(values)].sort(); 
    return { [key]: uniqueDocs };
  };
  
  const dataset = [
    { 'doc1': 'check stuff level' },
    { 'doc2': 'check stuff level' },
    { 'doc3': 'level check stuff' },
    { 'doc4': 'level right' },
    { 'doc5': 'link check stuff' },
    { 'doc6': 'right' },
    { 'doc7': 'simpl link check' },
    { 'doc8': 'stuff level check' },
    { 'doc9': 'stuff level right' },
  ];
    
  const expected = [
    {"level": ["doc1", "doc2", "doc3", "doc4", "doc8", "doc9"]}, 
    {"simpl": ["doc7"]}, 
    {"link": ["doc5", "doc7"]}, 
    {"check": ["doc1", "doc2", "doc3", "doc5", "doc7", "doc8"]}, 
    {"stuff": ["doc1", "doc2", "doc3", "doc5", "doc8", "doc9"]}, 
    {"right": ["doc4", "doc6", "doc9"]}
  ];
  
  // Test for this scenario
  const doMapReduce = (cb) => {
    distribution.ridx.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.ridx.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ridx.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:rlg', (done) => {
    done(new Error('Implement the map and reduce functions'));
});

/*
    This is the setup for the test scenario.
    Do not modify the code below.
*/

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  dlibGroup[id.getSID(n1)] = n1;
  dlibGroup[id.getSID(n2)] = n2;
  dlibGroup[id.getSID(n3)] = n3;

  tfidfGroup[id.getSID(n1)] = n1;
  tfidfGroup[id.getSID(n2)] = n2;
  tfidfGroup[id.getSID(n3)] = n3;

  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

  urlxtrGroup[id.getSID(n1)] = n1;
  urlxtrGroup[id.getSID(n2)] = n2;
  urlxtrGroup[id.getSID(n3)] = n3;

  strmatchGroup[id.getSID(n1)] = n1;
  strmatchGroup[id.getSID(n2)] = n2;
  strmatchGroup[id.getSID(n3)] = n3;

  ridxGroup[id.getSID(n1)] = n1;
  ridxGroup[id.getSID(n2)] = n2;
  ridxGroup[id.getSID(n3)] = n3;

  rlgGroup[id.getSID(n1)] = n1;
  rlgGroup[id.getSID(n2)] = n2;
  rlgGroup[id.getSID(n3)] = n3;


  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const ncdcConfig = {gid: 'ncdc'};
    startNodes(() => {
      distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
        distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          const dlibConfig = {gid: 'dlib'};
          distribution.local.groups.put(dlibConfig, dlibGroup, (e, v) => {
            distribution.dlib.groups.put(dlibConfig, dlibGroup, (e, v) => {
              const tfidfConfig = {gid: 'tfidf'};
              distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                distribution.tfidf.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                  const strmatchConfig = {gid: 'strmatch'};
                  distribution.local.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                    distribution.strmatch.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                      const ridxConfig = {gid: 'ridx'};
                      distribution.local.groups.put(ridxConfig, ridxGroup, (e, v) => {
                        distribution.ridx.groups.put(ridxConfig, ridxGroup, (e, v) => {
                          const urlxtrConfig = {gid: 'urlxtr'};
                          distribution.local.groups.put(urlxtrConfig, urlxtrGroup, (e, v) => {
                            distribution.urlxtr.groups.put(urlxtrConfig, urlxtrGroup, (e, v) => {
                              done();
                        })
                      });
                    })
                  });
                  })
                });
              });
            });
          });
        });
      });
    });
  });
});
})

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});


