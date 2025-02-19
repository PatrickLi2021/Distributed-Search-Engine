const distribution = require("@brown-ds/distribution");

const status = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  const remote = {service: 'status', method: 'get'};
  distribution.group = context.gid;

  return {
    get: (configuration, callback) => {
        if (configuration === "heapTotal") {
          distribution.group.comm.send(["heapTotal"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            // Iterate over v and aggregate heapTotals
            let heapTotalVal = 0;
            for (let nodeID in v) {
              heapTotalVal += v[nodeID];
            }
            return heapTotalVal;
          });
        } if (configuration === "heapUsed") {
          distribution.group.comm.send(["heapUsed"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            // Iterate over v and aggregate heapUsed
            let heapUsedVal = 0;
            for (let nodeID in v) {
              heapUsedVal += v[nodeID];
            }
            return heapUsedVal;
          });
        } if (configuration === "sid") {
          distribution.group.comm.send(["sid"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            return v;
          });
        } if (configuration === "nid") {
          distribution.group.comm.send(["nid"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            return v;
          });
        } if (configuration === "counts") {
          distribution.group.comm.send(["counts"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            // Iterate over v and aggregate counts
            let countsTotal = 0;
            for (let nodeID in v) {
              countsTotal += v[nodeID];
            }
            return countsTotal;
          });

        } if (configuration === "port") {
          distribution.group.comm.send(["port"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            return v;
          });

        } if (configuration === "ip") {
          distribution.group.comm.send(["port"], remote, (e, v) => {
            if (e) {
              callback(null, e);
              return;
            }
            return v;
          });
        }
  },

    spawn: (configuration, callback) => {
      const remote = {service: 'status', method: 'spawn'}; 
      
      // Spawn new node (configuration is the new node object)
      const newNode = distribution.local.comm.send(configuration, remote, (e, v) => {
        if (e) {
          callback(new Error("Error spawning nodes"), null);
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
      distribution.group.comm.send([], remote, (e, v) => {
        if (e) {
          callback(new Error("Error stopping nodes"), null);
        }
        callback(v, null);
        return;
      });

      // Stop node itself
      distribution.local.comm.send([], remote, (e, v) => {
        if (e) {
          callback(new Error("Error stopping nodes"), null);
        }
        callback(v, null);
        return;
      });
      
    },
  };
};

module.exports = status;
