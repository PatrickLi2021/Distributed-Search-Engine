const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};

let localServer = null;

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

test('Characterizing Performance of MapReduce on NCDC Test', (done) => {
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
    { '000': '006701199099999 1950 0515070049999999N9 +0000 1+9999' },
    { '106': '004301199099999 1950 0515120049999999N9 +0022 1+9999' },
    { '212': '004301199099999 1950 0515180049999999N9 -0011 1+9999' },
    { '318': '004301265099999 1949 0324120040500001N9 +0111 1+9999' },
    { '424': '004301265099999 1949 0324180040500001N9 +0078 1+9999' },
  ];

  const numIterations = 100;
  let completedRuns = 0;
  const startTime = Date.now();

  const doMapReduce = () => {
    distribution.ncdc.mr.exec(
      { keys: getDatasetKeys(dataset), map: mapper, reduce: reducer },
      (e, v) => {
        if (e) {
          done(e);
          return;
        }

        completedRuns++;
        if (completedRuns === numIterations) {
          const endTime = Date.now();
          const totalTime = endTime - startTime;
          console.log(`Total time for ${numIterations} runs: ${totalTime} ms`);
          console.log(`Average time per run: ${totalTime / numIterations} ms`);
          done();
        }
      }
    );
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ncdc.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        for (let i = 0; i < numIterations; i++) {
          doMapReduce();
        }
      }
    });
  });
});

/*
    Test setup and teardown
*/

function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

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

    const ncdcConfig = { gid: 'ncdc' };
    startNodes(() => {
      distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
        distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          done();
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = { service: 'status', method: 'stop' };
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
