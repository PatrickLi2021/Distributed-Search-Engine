/*
    This test case verifies that the system correctly detects 
    the need to reconfigure when a node is removed from the group.

    It ensures that:
    1. Data is initially stored in the correct nodes.
    2. When a node is removed, an update is provided and a reconfiguration is triggered.
    3. Data is successfully migrated to the remaining nodes.
    4. Data remains retrievable after reconfiguration.
*/

const distribution = require('../../config.js');
const { id } = require('../../distribution/util/util.js');

// Create a node group with 3 nodes (n1, n2, n3)
const n1 = { ip: '127.0.0.1', port: 9001 };
const n2 = { ip: '127.0.0.1', port: 9002 };
const n3 = { ip: '127.0.0.1', port: 9003 };

// Initialize the node group
let mygroupGroup = {};
mygroupGroup[id.getSID(n1)] = n1;
mygroupGroup[id.getSID(n2)] = n2;
mygroupGroup[id.getSID(n3)] = n3;

// Create a copy to track changes
let myGroupCopy = { ...mygroupGroup };

// Define test data: users and their corresponding keys
const users = [
    { first: 'a', last: '1' },
    { first: 'b', last: '2' },
    { first: 'c', last: '3' },
];

const keys = ['a', 'b', 'c'];

test('(15 pts) detect the need to reconfigure', (done) => {
    // Insert key-value pairs into the distributed memory
    distribution.mygroup.mem.put(users[0], keys[0], (e, v) => {
        distribution.mygroup.mem.put(users[1], keys[1], (e, v) => {
            distribution.mygroup.mem.put(users[2], keys[2], (e, v) => {
                
                // Function to check if group configuration has changed
                const periodicFunc = () => {
                    distribution.local.groups.get('mygroup', (e, v) => {
                        // Check if the group configuration has changed
                        if (JSON.stringify(Object.values(v)) !== JSON.stringify(Object.values(myGroupCopy))) {
                            const old = { ...myGroupCopy };
                            myGroupCopy = v;

                            const message = ['mygroup', v];
                            const remote = { service: 'groups', method: 'put' };

                            // Notify other nodes about the group change
                            distribution.mygroup.gossip.send(message, remote, (e, v) => {
                                // Trigger reconfiguration process
                                distribution.mygroup.mem.reconf(old, (e, v) => {
                                    return;
                                });
                            });
                        } else {
                            return;
                        }
                    });
                };

                // Remove node n2 from the group
                distribution.local.groups.rem('mygroup', id.getSID(n2), (e, v) => {
                    // Periodically check for changes and trigger reconfiguration
                    distribution.mygroup.gossip.at(50, periodicFunc, (e, v) => {
                        const intervalID = v;
                        setTimeout(() => {
                            checkPlacement();
                        }, 2000);
                    });
                });
            });
        });
    });

    /*
        Function to verify if the keys are still accessible after 
        reconfiguration and stored in the correct nodes.
    */
    const checkPlacement = (e, v) => {
        try {
            // Retrieve values from the remaining node (n1)
            const remote = { node: n1, service: 'mem', method: 'get' };
            const messages = [
                [{ key: keys[0], gid: 'mygroup' }],
                [{ key: keys[1], gid: 'mygroup' }],
                [{ key: keys[2], gid: 'mygroup' }],
            ];

            // Validate that all keys are still retrievable after reconfiguration
            distribution.local.comm.send(messages[0], remote, (e, v) => {
                try {
                    expect(e).toBeFalsy();
                    expect(v).toEqual(users[0]);
                } catch (error) {
                    done(error);
                    return;
                }
                distribution.local.comm.send(messages[1], remote, (e, v) => {
                    try {
                        expect(e).toBeFalsy();
                        expect(v).toEqual(users[1]);
                    } catch (error) {
                        done(error);
                        return;
                    }
                    distribution.local.comm.send(messages[2], remote, (e, v) => {
                        try {
                            expect(e).toBeFalsy();
                            expect(v).toEqual(users[2]);
                            done();
                        } catch (error) {
                            done(error);
                            return;
                        }
                    });
                });
            });
        } catch (error) {
            done(error);
            return;
        }
    };
});

/*
    Following is the setup for the tests.
*/

/*
   This is necessary since we can not
   gracefully stop the local listening node.
   This is because the process that node is
   running in is the actual jest process
*/
let localServer = null;

beforeAll((done) => {
  // First, stop the nodes if they are running
  const remote = {service: 'status', method: 'stop'};

  const fs = require('fs');
  const path = require('path');

  fs.rmSync(path.join(__dirname, '../store'), {recursive: true, force: true});
  fs.mkdirSync(path.join(__dirname, '../store'));

  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        startNodes();
      });
    });
  });

  const startNodes = () => {

    // Now, start the nodes listening node
    distribution.node.start((server) => {
      localServer = server;

      const groupInstantiation = () => {
        const mygroupConfig = {gid: 'mygroup'};

        // Create the groups
        distribution.local.groups.put(mygroupConfig, mygroupGroup, (e, v) => {
          distribution.mygroup.groups
              .put(mygroupConfig, mygroupGroup, (e, v) => {
                done();
              });
        });
      };

      // Start the nodes
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
                  groupInstantiation();
                });
              });
            });
          });
  };
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