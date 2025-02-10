/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const util = require('@brown-ds/distribution/distribution/util/util.js');
const distribution = require('../../config.js');
const local = distribution.local;
const id = distribution.util.id;
const routes = distribution.local.routes;

// Test for status.get
test('(1 pts) student test', (done) => {
  local.status.get('counts', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(global.moreStatus.counts);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  local.status.get('port', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(global.nodeConfig.port);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  local.status.get('heapTotal', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(process.memoryUsage().heapTotal);
      done();
    } catch (error) {
      done(error);
    }
  });
});

// Test for routes.get
test('(1 pts) student test', (done) => {
  local.routes.get('nonexistent', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  local.routes.get('', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

// Test for routes.put/routes.get combined
test('(1 pts) student test', (done) => {
  const studentService = {};

  studentService.method = () => {
    const a = 5;
    return a + 5;
  };

  local.routes.put(studentService, 'method', (e, v) => {
    local.routes.get('method', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.method()).toBe(10);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  const studentService = {};

  studentService.method = () => {
    const a = 5;
    const b = 6;
    return String(a) + String(b) + "5";
  };

  local.routes.put(studentService, 'method', (e, v) => {
    local.routes.get('method', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v.method()).toBe("565");
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

// Test for routes.rem
test('(1 pts) student test', (done) => {
  const studentService = {};

  studentService.method = () => {
    const a = 5;
    return a + 5;
  };

  local.routes.put(studentService, 'method', (e, v) => {
    local.routes.rem('method', (e, v) => {
      local.routes.get('method', (e, v) => {
        try {
          expect(e).toBeDefined();
          expect(v).toBeFalsy();
          done();
        } catch (error) {
          done(error);
        }
      });
    })
  });
});

test('(1 pts) student test', (done) => {
  const studentService = {};

  studentService.method = () => {
    const a = 5;
    return a + 5;
  };

    local.routes.rem('method', (e, v) => {
        try {
          expect(e).toBeDefined();
          expect(v).toBeFalsy();
          done();
        } catch (error) {
          done(error);
        }
  });
});


// Test for comm.send
test('(1 pts) student test', (done) => {
  const node = distribution.node.config;

  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['sid']; 

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(id.getSID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  const node = distribution.node.config;

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

let localServer = null;

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