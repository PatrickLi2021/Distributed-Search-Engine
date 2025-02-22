const { getNID, getSID } = require('../util/id');

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  const remote = {service: 'status', method: 'get'};

  return {
    get: (configuration, callback) => {
      const remote = {service: 'status', method: 'get'};
      global.distribution[context.gid].comm.send([configuration], remote, (e, v) => {
      if (configuration === 'heapTotal' || configuration === 'counts' || configuration == 'heapUsed') { 
        let res = 0;
        for (const nodeID in v) {
          res += v[nodeID];
        }
        callback(e, res);
      } else {
          callback(e, v);
        }
      });
    },

    spawn: (configuration, callback) => {
      // Spawn new node (configuration is the new node object)
      distribution.local.status.spawn(configuration, (e, v) => {
        if (e) {
          callback(new Error('Error spawning nodes'), null);
          return;
        }
        global.distribution.local.groups.add(context.gid, configuration, (e, v) => {
          console.log("inside all callback");
          console.log("v: ", v);
          console.log("e: ", e);
          callback(null, v);
        });
      // Add that node to corresponding group for all nodes
      const remote = {service: 'groups', method: 'add'};
      console.log("HERE IS THE V: ", v);
      global.distribution[context.gid].comm.send([context.gid, v], remote, (e, v) => {
        console.log("inside final callback");
        console.log("v: ", v);
        console.log("e: ", e);
      });
      });
    },

    stop: (callback) => {
      const errorMap = {};
      const valueMap = {};
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error("Couldn't get group nodes"), null);
          return;
        }
      // Issue a stop call to all nodes except the local node
      let count = 0;
      for (const node of Object.values(v)) {
        const nodeNID = getNID(node);
        const nodeSID = getSID(node);
        const remote = {service: 'status', method: 'stop', node: node};
        if (nodeNID !== global.nodeConfig.nid) {
          global.distribution.local.comm.send([], remote, (e, v) => {
            if (e) {
              errorMap[nodeSID] = e;
            } else {
              valueMap[nodeSID] = v;
            }
            count += 1;
            if (count === Object.keys(v).length) {
              callback(errorMap, valueMap);
            }
          })
        } else {
          count += 1;
        }
      }
      callback(errorMap, valueMap);
      });
  }};
};


module.exports = status;
