const { id } = require("../util/util");

function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed store service, the configuration will always be a string */

  return {
    get: (configuration, callback) => {
      // Convert primary key to key identifier (KID) by applying SHA256 on the primary key
      const kid = id.getID(configuration);

      // Find the node to retrieve the object on
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error("Could not get nodes"), null);
          return;
        }
        const nids = Object.values(v).map(node => id.getNID(node));
        
        // Run the hashing algorithm on the KID and the NIDs
        const nodeID = context.hash(kid, nids);
        const nodeWithVal = Object.values(v).find(node => id.getNID(node) === nodeID);

        // Retrieve value by issuing a local.comm.send request
        const remote = {node: nodeWithVal, service: 'store', method: 'get'};
        global.distribution.local.comm.send([configuration], remote, (e, v) => {
          if (e) {
            callback(new Error("Could not get object"), null);
            return;
          }
          callback(null, v);
        });
      });
    },

    put: (state, configuration, callback) => {
      // Hash the primary key to get the KID
      let kid = "";
      if (configuration !== null) {
        kid = id.getID(configuration)
      } else {
        kid = id.getID(id.getID(state));
      }

      // Get the list of NIDs
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error("Could not get nodes"), null);
          return;
        }
        const nids = Object.values(v).map(node => id.getNID(node));
        
        // Run the hashing algorithm on the KID and the NIDs
        const nodeID = context.hash(kid, nids);
        const nodeToStoreOn = Object.values(v).find(node => id.getNID(node) === nodeID);

        // Normalize configuration
        configuration = {gid: context.gid, key: configuration, node: nodeToStoreOn };

        // Call local.comm.send to invoke mem on that node
        const remote = {node: nodeToStoreOn, service: 'store', method: 'put'};
        global.distribution.local.comm.send([state, configuration], remote, (e, v) => {
          if (e) {
            callback(new Error("Could not put object on node"), null);
            return;
          }
          callback(null, v);
        });
        });
    },

    del: (configuration, callback) => {
      // Convert primary key to key identifier (KID) by applying SHA256 on the primary key
      const kid = id.getID(configuration);

      // Find the node to delete object from
      global.distribution.local.groups.get(context.gid, (e, v) => {
        if (e) {
          callback(new Error("Could not get nodes"), null);
          return;
        }
        const nids = Object.values(v).map(node => id.getNID(node));
        
        // Run the hashing algorithm on the KID and the NIDs
        const nodeID = context.hash(kid, nids);
        const nodeWithVal = Object.values(v).find(node => id.getNID(node) === nodeID);

        // Delete object by issuing a local.comm.send request
        const remote = {node: nodeWithVal, service: 'store', method: 'del'};
        global.distribution.local.comm.send([configuration], remote, (e, v) => {
          if (e) {
            callback(new Error("Could not delete object"), null);
            return;
          }
          callback(null, v);
        });
      });
    },

    reconf: (configuration, callback) => {
    },
  };
};

module.exports = store;
