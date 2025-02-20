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
      const remote = {service: 'status', method: 'spawn'};

      // Spawn new node (configuration is the new node object)
      const newNode = distribution.local.comm.send(configuration, remote, (e, v) => {
        if (e) {
          callback(new Error('Error spawning nodes'), null);
        }
        callback(v, null);
        return;
      });

      // Add that node to corresponding group for all nodes
      distribution.group.groups.add(context.id, newNode, (e, v) => {

      });
    },

    stop: (callback) => {
      const remote = {service: 'status', method: 'stop'};
      // Issue a status.stop call to all nodes in group
      global.distribution[context.gid].comm.send([], remote, (e, v) => {
        if (e) {
          callback(new Error('Error stopping nodes'), null);
        }
        callback(v, null);
        return;
      });
    },
  };
};

module.exports = status;
