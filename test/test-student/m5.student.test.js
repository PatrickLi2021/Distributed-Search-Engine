/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;

const test1Group = {};
const test2Group = {};
const test3Group = {};
const test4Group = {};
const test5Group = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};
const n4 = {ip: '127.0.0.1', port: 7113};

test('(1 pts) Student Test 1', (done) => {
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
  ];

  const expected = [{'1950': 22}];

  const doMapReduce = (cb) => {
    distribution.test1Group.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expected);
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
    distribution.test1Group.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) Student Test 2', (done) => {
  const mapper = (key, value) => {
    const parts = value.split(',');
    const category = parts[1];  
    const sales = parseFloat(parts[2]); 
    
    return [{ [category]: sales }];
  };
  
  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, val) => sum + val, 0);
    return out;
  };
  
  const dataset = [
    {'1': '1,Laundry,500.00'},
    {'2': '2,Groceries,120.50'},
    {'3': '3,Tuition,300.25'},
    {'4': '4,Food,75.00'},
    {'5': '5,Groceries,220.00'},
    {'6': '6,Clothing,150.75'}
  ];
  
  const expected = [{"Laundry": 500}, {"Clothing": 150.75}, {"Groceries": 340.5}, {"Food": 75}, {"Tuition": 300.25}]
  
  const doMapReduce = (cb) => {
    distribution.test2Group.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.test2Group.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
  
});


test('(1 pts) Student Test 3', (done) => {
  const mapper = (key, value) => {
    const parts = value.split(',');
    const category = parts[0];
    const rating = parseFloat(parts[1]);
    
    return [{ [category]: rating }];
  };
  
  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    return out;
  };
  
  const dataset = [
    {'1': 'Kung Fu Panda,5'},
    {'2': 'Ne Zha 2,4'},
    {'3': 'Jaws,3'},
    {'4': 'Jurassic Park,4'},
    {'5': 'Harry Potter,5'},
    {'6': 'Harry Potter,4'},
    {'7': 'Jaws,3'}
  ];
  
  const expected = [{"Harry Potter": 4.5}, {"Jaws": 3}, {"Jurassic Park": 4}, {"Kung Fu Panda": 5}, {"Ne Zha 2": 4}];
  
  const doMapReduce = (cb) => {
    distribution.test3Group.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.test3Group.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
  
});

test('(1 pts) Student Test 4', (done) => {
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
  
  const dataset = [
    {'1': 'StoreA,100'}, {'2': 'StoreB,200'}, {'3': 'StoreC,150'},
    {'4': 'StoreA,50'},  {'5': 'StoreB,300'}, {'6': 'StoreC,200'},
    {'7': 'StoreA,75'},  {'8': 'StoreB,50'},  {'9': 'StoreC,300'},
    {'10': 'StoreA,125'}, {'11': 'StoreB,500'}, {'12': 'StoreC,250'},
    {'13': 'StoreA,80'},  {'14': 'StoreB,140'}, {'15': 'StoreC,180'},
    {'16': 'StoreA,95'},  {'17': 'StoreB,210'}, {'18': 'StoreC,200'},
    {'19': 'StoreA,60'},  {'20': 'StoreB,350'}, {'21': 'StoreC,300'}
  ];
  
  const expected = [{"StoreC": 1580}, {"StoreA": 585}, {"StoreB": 1750}];
  
  const doMapReduce = (cb) => {
    distribution.test4Group.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.test4Group.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
  
});

test('(1 pts) Student Test 5', (done) => {
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
  
  // Empty dataset
  const dataset = [];
  
  const expected = [];
  
  const doMapReduce = (cb) => {
    distribution.test5Group.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
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
    distribution.test5Group.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });  
  doMapReduce();
});

/*
    Test setup and teardown
*/

// Helper function to extract keys from dataset (in case the get(null) funnctionality has not been implemented)
function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

beforeAll((done) => {
  test1Group[id.getSID(n1)] = n1;
  test1Group[id.getSID(n2)] = n2;
  test1Group[id.getSID(n3)] = n3;

  test2Group[id.getSID(n1)] = n1;
  test2Group[id.getSID(n2)] = n2;
  test2Group[id.getSID(n3)] = n3;

  test3Group[id.getSID(n1)] = n1;
  test3Group[id.getSID(n2)] = n2;
  test3Group[id.getSID(n3)] = n3;
  test3Group[id.getSID(n4)] = n4;

  test4Group[id.getSID(n1)] = n1;
  test4Group[id.getSID(n2)] = n2;
  test4Group[id.getSID(n3)] = n3;

  test5Group[id.getSID(n1)] = n1;
  test5Group[id.getSID(n2)] = n2;
  test5Group[id.getSID(n3)] = n3;
  test5Group[id.getSID(n4)] = n4;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          distribution.local.status.spawn(n4, (e, v) => {
            cb();
          });
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const test1Config = {gid: 'test1Group'};
    startNodes(() => {
      distribution.local.groups.put(test1Config, test1Group, (e, v) => {
        distribution.test1Group.groups.put(test1Config, test1Group, (e, v) => {
          const test2Config = {gid: 'test2Group'};
          distribution.local.groups.put(test2Config, test2Group, (e, v) => {
            distribution.test2Group.groups.put(test2Config, test2Group, (e, v) => {
              const test3Config = {gid: 'test3Group'};
              distribution.local.groups.put(test3Config, test3Group, (e, v) => {
                distribution.test3Group.groups.put(test3Config, test3Group, (e, v) => {
                  const test4Config = {gid: 'test4Group'};
                  distribution.local.groups.put(test4Config, test4Group, (e, v) => {
                    distribution.test4Group.groups.put(test4Config, test4Group, (e, v) => {
                      const test5Config = {gid: 'test5Group'};
                      distribution.local.groups.put(test5Config, test5Group, (e, v) => {
                        distribution.test5Group.groups.put(test5Config, test5Group, (e, v) => {
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
      });
    });
  });
});
  

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          localServer.close();
          done();
        });
      });
    });
  });
});
