const distribution = require('../../config.js');

let localServer = null;
const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const n4 = {ip: '127.0.0.1', port: 8003};

test('throughput of spawn', (done) => {
  const start = performance.now();
  distribution.local.status.spawn(n1, (e, v) => {
    distribution.local.status.spawn(n2, (e, v) => {
      distribution.local.status.spawn(n3, (e, v) => {
        distribution.local.status.spawn(n4, (e, v) => {
              const end = performance.now();
              console.log("Total Time", end - start);
              console.log("Throughput ", 4/((end-start)));
              done();
            });
          });
        });
      });
    });


test('latency of spawn', (done) => {
  const start = performance.now();
  distribution.local.status.spawn(n1, (e, v) => {
    const end = performance.now();
    console.log("latency of spawn (ms): ", end - start);
    done();
  });
});


beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        remote.node = n4;
      });
    });
  });

  
  distribution.node.start((server) => {
    localServer = server;
    done();
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
      });
    });
  });

});