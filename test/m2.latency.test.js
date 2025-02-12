const distribution = require('../config.js');
const node = distribution.node.config;
const local = distribution.local;
const util = distribution.util;
const { performance } = require('perf_hooks');

// NOTE: I use this file to calculate both throughput and latency
const start = performance.now();
for (let i = 0; i < 1000; i++) {
test('Latency/Throughput Test for comm', (done) => {
    const remote = {node: node, service: 'status', method: 'get'};
    const message = ['heapTotal']; 
  
    local.comm.send(message, remote, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(process.memoryUsage().heapTotal);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
}
const end = performance.now();
console.log("Total Time: ", (end - start).toFixed(2));


const start2 = performance.now();
for (let i = 0; i < 1000; i++) {
test('Latency/Throughput Test for RPC', (done) => {
  let n = 0;
  const addOne = () => {
    return ++n;
  };

  const node = {ip: '127.0.0.1', port: 9001};

  // Place the RPC stub for addOne on node
  addOneRPC = util.wire.createRPC(util.wire.toAsync(addOne));

  const rpcService = {
    addOne: addOneRPC,
  };

  distribution.node.start((server) => {
    function cleanup(callback) {
      server.close();
      distribution.local.comm.send([],
          {node: node, service: 'status', method: 'stop'},
          callback);
    }

    // Spawn the remote node.
    distribution.local.status.spawn(node, (e, v) => {
      // Install the addOne service on the remote node with the name 'addOneService'.
      distribution.local.comm.send([rpcService, 'addOneService'],
          {node: node, service: 'routes', method: 'put'}, (e, v) => {
            // Call the addOne service on the remote node. This should actually call the addOne function on this code using RPC.
            distribution.local.comm.send([],
                {node: node, service: 'addOneService', method: 'addOne'}, (e, v) => {
                  // Call the addOne service on the remote node again.
                  distribution.local.comm.send([],
                      {node: node, service: 'addOneService', method: 'addOne'}, (e, v) => {
                        // Call the addOne service on the remote node again. Since we called the addOne function three times, the result should be 3.
                        distribution.local.comm.send([],
                            {node: node, service: 'addOneService', method: 'addOne'}, (e, v) => {
                              try {
                                expect(e).toBeFalsy();
                                expect(v).toBe(3);
                                /* The local variable n should also be 3. Remember: The addOne RPC is actually invoking the addOne function locally. */
                                expect(n).toBe(3);
                                cleanup(done);
                              } catch (error) {
                                cleanup(() => {
                                  done(error);
                                });
                              }
                            });
                      });
                });
          });
    });
  });
})};
const end2 = performance.now();
console.log("Total Time: ", (end2 - start2).toFixed(2));


beforeAll((done) => {
    distribution.node.start((server) => {
      localServer = server;
      done();
    });
  });
  
  afterAll((done) => {
    localServer.close();
    done();
  });