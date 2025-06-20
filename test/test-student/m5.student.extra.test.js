/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const compactGroup = {};
const distributedPersistenceGroup = {};
const inMemGroup = {};
const iterativeGroup = {};

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

/* 
Since the compaction stage is an intermediate stage, I just tested to make sure that normal MapReduce worked fine
and printed out the intermediate result to verify that it the output of each map execution was later being 
compacted
*/
test('(15 pts) implement compaction', (done) => {
    const mapper = (key, value) => {
        const parts = value.split(',');
        const storeID = parts[0];
        const saleAmount = parseFloat(parts[1]); 
        
        return [{ [storeID]: saleAmount }];
    };

    const reducer = (key, values) => {
        const out = {};
        out[key] = values.reduce((sum, val) => sum + val, 0);
        return out;
    };

    // Compact Function
    const compact = (mapOutput) => {
        const combined = {};
        mapOutput.forEach(item => {
        const key = Object.keys(item)[0];
        const value = Object.values(item)[0];

        if (combined[key]) {
            combined[key] += value;
        } else {
            combined[key] = value;
        }
        });
        return Object.entries(combined).map(([key, value]) => ({ [key]: value }));
    };

    const dataset = [
        {'1': 'Walmart,100'}, {'2': 'CVS,200'}, {'3': 'Giant,150'},
        {'4': 'Walmart,50'},  {'5': 'CVS,300'}, {'6': 'Giant,200'},
        {'7': 'Walmart,75'},  {'8': 'CVS,50'},  {'9': 'Giant,300'},
        {'10': 'Walmart,125'}, {'11': 'CVS,500'}, {'12': 'Giant,250'},
        {'13': 'Walmart,80'},  {'14': 'CVS,140'}, {'15': 'Giant,180'},
        {'16': 'Walmart,95'},  {'17': 'CVS,210'}, {'18': 'Giant,200'},
        {'19': 'Walmart,60'},  {'20': 'CVS,350'}, {'21': 'Giant,300'}
    ];

    const expected = [{"Giant": 1580}, {"Walmart": 585}, {"CVS": 1750}];

    const doMapReduce = (cb) => {
        distribution.compactGroup.mr.exec({
        keys: getDatasetKeys(dataset),
        map: mapper,
        reduce: reducer,
        compact: compact
        }, (e, v) => {
        try {
            expect(v).toEqual(expect.arrayContaining(expected));
            done();
        } catch (e) {
            done(e);
        }
        });
    };

    let cntr = 0;
    dataset.forEach((o) => {
        const key = Object.keys(o)[0];
        const value = o[key];
        distribution.compactGroup.store.put(value, key, (e, v) => {
        cntr++;
        if (cntr === dataset.length) {
            doMapReduce();
        }
        });
    });
});

/* 
    In order to test distributed persistence, I ran a regular MapReduce workflow but in the exec 
    configuration, I specified an out group in the distributed storage that each reducer node writes
    its intermediate output to.
*/
test('(15 pts) add support for distributed persistence', (done) => {
    const mapper = (key, value) => {
        const words = value.split(/(\s+)/).filter((e) => e !== ' ');
        const out = {};
        out[words[1]] = parseInt(words[3]);
        
        return [out];
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
        distribution.distributedPersistenceGroup.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer, out: 'out'}, (e, v) => {
            try {
            expect(v).toEqual(expect.arrayContaining(expected));
            done();
            } catch (e) {
            done(e);
            }
        });
        };

        let cntr = 0;
        dataset.forEach((o) => {
        const key = Object.keys(o)[0];
        const value = o[key];
        distribution.distributedPersistenceGroup.store.put(value, key, (e, v) => {
            cntr++;
            if (cntr === dataset.length) {
            doMapReduce();
            }
        });
    });
});

test('(5 pts) add support for optional in-memory operation', (done) => {
    const mapper = (key, value) => {
        const words = value.split(/(\s+)/).filter((e) => e !== ' ');
        const out = {};
        out[words[1]] = parseInt(words[3]);
        
        return [out];
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
        distribution.inMemGroup.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer, out: 'out', memory: true}, (e, v) => {
            try {
            expect(v).toEqual(expect.arrayContaining(expected));
            done();
            } catch (e) {
            done(e);
            }
        });
        };

        let cntr = 0;
        dataset.forEach((o) => {
        const key = Object.keys(o)[0];
        const value = o[key];
        distribution.inMemGroup.mem.put(value, key, (e, v) => {
            cntr++;
            if (cntr === dataset.length) {
                doMapReduce();
            }
        });
    });
});

test('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = (key, value) => {
    const words = value.split(/(\s+)/).filter((e) => e !== ' ');
    const out = {};
    out[words[1]] = parseInt(words[3]);
    
    return [out];
  };

  const mapper2 = (key, value) => {
    const out = {};
    out[key] = parseInt(value) + 50;
    return [out];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
    return out;
  };

  const reducer2 = (key, values) => {
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

  const expected = [{"1950": 72}, {"1949": 161}];

  const doMapReduce = (cb) => {
    distribution.iterativeGroup.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer, map2: mapper2, reduce2: reducer2, curIter: 1, maxIter: 2, memory: false, out: 'out'}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.iterativeGroup.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
  // const mapper = (key, value) => {
  //   const words = value.split(/(\s+)/).filter((e) => e !== ' ');
  //   const out = {};
  //   out[words[1]] = parseInt(words[3]); 
  //   return [out];
  // };

  // const reducer = (key, values) => {
  //   const out = {};
  //   out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
  //   return out;
  // };

  // const secondMapper = (key, value) => {
  //   const out = {};
  //   out[key] = value * 2;
  //   return [out];
  // };

  // const secondReducer = (key, values) => {
  //   const out = {};
  //   out[key] = values.reduce((a, b) => a + b, 0); 
  //   return out;
  // };

  // const dataset = [
  //   {'000': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
  //   {'106': '004301199099999 1950 0515120049999999N9 +0022 1+9999'},
  // ];

  // const expected = [{'1950': 44}];

  // const config = {
  //   keys: getDatasetKeys(dataset),
  //   map: (key, value) => (config.curIter === 1 ? mapper(key, value) : secondMapper(key, value)),
  //   reduce: (key, values) => (config.curIter === 1 ? reducer(key, values) : secondReducer(key, values)),
  //   curIter: 1,
  //   maxIter: 1,
  // };

  // distribution.iterativeGroup.mr.exec(config, (e, v) => {
  //   try {
  //     if (e) return done(e);
  //     expect(v).toEqual(expected);
  //     done();
  //   } catch (err) {
  //     done(err);
  //   }
  // });

  // let cntr = 0;
  // dataset.forEach((o) => {
  //   const key = Object.keys(o)[0];
  //   const value = o[key];
  //   distribution.iterativeGroup.store.put(value, key, (e, v) => {
  //     cntr++;
  //     if (cntr === dataset.length) {
  //       distribution.iterativeGroup.mr.exec(config, done);
  //     }
  //   });
  // });
});

/*
    Test setup and teardown
*/

// Helper function to extract keys from dataset (in case the get(null) funnctionality has not been implemented)
function getDatasetKeys(dataset) {
    return dataset.map((o) => Object.keys(o)[0]);
  }
  
  beforeAll((done) => {
    compactGroup[id.getSID(n1)] = n1;
    compactGroup[id.getSID(n2)] = n2;
    compactGroup[id.getSID(n3)] = n3;
  
    distributedPersistenceGroup[id.getSID(n1)] = n1;
    distributedPersistenceGroup[id.getSID(n2)] = n2;
    distributedPersistenceGroup[id.getSID(n3)] = n3;
  
    inMemGroup[id.getSID(n1)] = n1;
    inMemGroup[id.getSID(n2)] = n2;
    inMemGroup[id.getSID(n3)] = n3;
  
    iterativeGroup[id.getSID(n1)] = n1;
    iterativeGroup[id.getSID(n2)] = n2;
    iterativeGroup[id.getSID(n3)] = n3;
  
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
  
      const compactConfig = {gid: 'compactGroup'};
      startNodes(() => {
        distribution.local.groups.put(compactConfig, compactGroup, (e, v) => {
          distribution.compactGroup.groups.put(compactConfig, compactGroup, (e, v) => {
            const distributedPersistenceConfig = {gid: 'distributedPersistenceGroup'};
            distribution.local.groups.put(distributedPersistenceConfig, distributedPersistenceGroup, (e, v) => {
              distribution.distributedPersistenceGroup.groups.put(distributedPersistenceConfig, distributedPersistenceGroup, (e, v) => {
                const inMemConfig = {gid: 'inMemGroup'};
                distribution.local.groups.put(inMemConfig, inMemGroup, (e, v) => {
                  distribution.inMemGroup.groups.put(inMemConfig, inMemGroup, (e, v) => {
                    const iterativeConfig = {gid: 'iterativeGroup'};
                    distribution.local.groups.put(iterativeConfig, iterativeGroup, (e, v) => {
                      distribution.iterativeGroup.groups.put(iterativeConfig, iterativeGroup, (e, v) => {
                            done();
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
    });
    
  
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
