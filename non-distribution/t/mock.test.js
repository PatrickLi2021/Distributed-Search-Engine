const distribution = require('../config.js');
const local = distribution.local;
const id = distribution.util.id;

test('(10 pts) local.comm(status.get(nid))', (done) => {
  const node = distribution.node.config;

  const remote = {node: node, service: 'status', method: 'get'};
  const message = ['nid']; // Arguments to the method

  local.comm.send(message, remote, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(id.getNID(node));
      done();
    } catch (error) {
      done(error);
    }
  });
});