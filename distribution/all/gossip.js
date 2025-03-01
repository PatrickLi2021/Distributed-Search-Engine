const { count } = require("yargs");
const crypto = require('crypto');

const gossip = function(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.subset = config.subset || function(lst) {
    return Math.ceil(Math.log(lst.length));
  };

  return {
    send: (payload, remote, callback) => {
      console.log("\n");
      console.log("INSIDE GOSSIP SEND");
      console.log('\n');
      // Put nodes in a list and form a new group
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error("Could not get nodes"), null);
          return;
        }
        const nodeArray = Object.values(v);
        const nodeKeys = Object.keys(v);
        const logn = context.subset(nodeArray);
        const nodeGroup = {};
        while (Object.keys(nodeGroup).length < logn) {
          const randomIndex = Math.floor(Math.random() * logn);
          nodeGroup[nodeKeys[randomIndex]] = nodeArray[randomIndex];
        }
        // Put this group on the local node
        global.distribution.local.groups.put("newgroup", nodeGroup, (e, v) => {
          if (e) {
            callback(new Error("Groups put failed"), null);
            return;
          }
          global.distribution.newgroup.comm.send(payload, remote, (e, v) => {
            if (e) {
              callback(new Error("issue with comm.send to all nodes"), null);
              return;
            }
          });
        })
      })
    },

    at: (period, func, callback) => {
      console.log("\n");
      console.log("INSIDE GOSSIP AT");
      console.log('\n');
      // Error check parameters  
      if (typeof func !== 'function' || typeof period !== 'number' || period <= 0) {
          callback(new Error("Invalid parameters"), null);
          return;
        }
        // Generate unique ID for interval and setInterval
        const uniqueID = crypto.randomUUID();
        const timer = setInterval(() => func(), period);
        callback(null, uniqueID)
      },
    
      del: (intervalID, callback) => {
          clearInterval(intervalID);
          callback(null, "Task stopped successfully");
    },
  };
};

module.exports = gossip;
