/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
const distribution = require('../../config.js');
const id = distribution.util.id;
const mygroupConfig = {gid: 'mygroup'};
const mygroupGroup = {};

let localServer = null;

const n1 = {ip: '127.0.0.1', port: 1001};
const n2 = {ip: '127.0.0.1', port: 1002};
const n3 = {ip: '127.0.0.1', port: 1003};
const n4 = {ip: '127.0.0.1', port: 1004};
const n5 = {ip: '127.0.0.1', port: 1005};

test('(1 pts) student test', (done) => {
  const sids = Object.values(mygroupGroup).map((node) => id.getSID(node));
  const remote = {node: n3, service: 'groups', method: 'put'};

  distribution.local.comm.send([mygroupConfig, mygroupGroup], remote, (e, v) => {
    const remote = {node: n3, gid: 'mygroup', service: 'status', method: 'get'};

    distribution.local.comm.send(['sid'], remote, (e, v) => {
      expect(e).toEqual({});

      try {
        expect(Object.values(v).length).toBe(sids.length);
        expect(Object.values(v)).toEqual(expect.arrayContaining(sids));
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  distribution.mygroup.status.get('unknownkey', (e, v) => {
    try {
      Object.keys(mygroupGroup).forEach((sid) => {
        expect(e[sid]).toBeDefined();
        expect(e[sid]).toBeInstanceOf(Error);
      });
      expect(v).toEqual({});
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  const studentService = {};

  studentService.echo = () => {
    return 'studentService';
  };

  distribution.mygroup.routes.put(studentService, 'echo', (e, v) => {
    const r1 = {node: n1, service: 'routes', method: 'get', gid: 'local'};
    const r2 = {node: n2, service: 'routes', method: 'get'};
    const r3 = {node: n3, service: 'routes', method: 'get'};
    const r4 = {node: n4, service: 'routes', method: 'get', gid: 'mygroup'};

    distribution.local.comm.send(['echo'], r1, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.echo()).toBe('studentService');
      } catch (error) {
        done(error);
        return;
      }
      distribution.local.comm.send([{service: 'echo'}], r2, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v.echo()).toBe('studentService');
        } catch (error) {
          done(error);
          return;
        }
        distribution.local.comm.send([{service: 'echo', gid: 'local'}], r3, (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v.echo()).toBe('studentService');
            done();
          } catch (error) {
            done(error);
            return;
          }
          distribution.local.comm.send([{service: 'echo'}], r4, (e, v) => {
            try {
              expect(e).toBeDefined();
              expect(e).toBeInstanceOf(Error);
              expect(v).toBe(null);
              done();
            } catch (error) {
              done(error);
              return;
            }
          });
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  distribution.mygroup.status.get('counts', (e, v) => {
    console.log("v: ", v);
    try {
      expect(e).toStrictEqual({});
      expect(v).toBe(0);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  distribution.mygroup.status.get('heapTotal', (e, v) => {
    console.log("v: ", v);
    console.log("e: ", e);
    try {
      expect(e).toStrictEqual({});
      expect(v).toEqual(expect.any(Number));
      done();
    } catch (error) {
      done(error);
    }
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
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
              startNodes();
          });
        });
      });
    });
  });

  const startNodes = () => {
    mygroupGroup[id.getSID(n1)] = n1;
    mygroupGroup[id.getSID(n2)] = n2;
    mygroupGroup[id.getSID(n3)] = n3;
    mygroupGroup[id.getSID(n4)] = n4;
    mygroupGroup[id.getSID(n5)] = n5;


    const groupInstantiation = () => {
      // Create the groups
      distribution.local.groups
          .put(mygroupConfig, mygroupGroup, (e, v) => {
            done();
          });
    };


    // Now, start the nodes listening node
    distribution.node.start((server) => {
      localServer = server;
      // Start the nodes
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
            distribution.local.status.spawn(n4, (e, v) => {
              distribution.local.status.spawn(n5, (e, v) => {
                  groupInstantiation();
              });
            });
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
        remote.node = n4;
        distribution.local.comm.send([], remote, (e, v) => {
          remote.node = n5;
          distribution.local.comm.send([], remote, (e, v) => {
              localServer.close();
              done();
            });
          });
      });
    });
  });
});