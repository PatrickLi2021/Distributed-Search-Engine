const { id } = require("../util/util");

function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;
  
  /* For the distributed mem service, the configuration will
          always be a string */
  return {

    /*
    * Parameters:
    * - configuration: a string representing the key used to retrieve the value
    * - callback: function to call after executing get
    * 
    * Note: The type of hashing technique used is stored in context.hash
    */
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

        // Normalize configuration
        configuration = {gid: context.gid, key: configuration};

        // Retrieve value by issuing a local.comm.send request
        const remote = {node: nodeWithVal, service: 'mem', method: 'get'};
        global.distribution.local.comm.send([configuration], remote, (e, v) => {
          if (e) {
            callback(new Error("Could not get object"), null);
            return;
          }
          callback(null, v);
        });
      });
    },


    /*
    * Parameters:
    * - state: the object that we're trying to put into our mem store (the key will map to this)
    * - configuration: a string representing the key used to retrieve the value
    * - callback: function to call after executing put
    * 
    * Note: The type of hashing technique used is stored in context.hash
    */
    put: (state, configuration, callback) => {
      // distributed put always passes in object of key and gid
      // Hash the primary key to get the KID
      let kid = "";
      if (configuration !== null) {
        kid = id.getID(configuration)
      } else {
        kid = id.getID(id.getID(state));
      }
      
      if (typeof configuration === 'string') {
        configuration = serialize({gid: context.gid, key: configuration});
      }
      else if (configuration === null) {
        configuration = serialize({gid: context.gid, key: id.getID(state)});
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

        // Call local.comm.send to invoke mem on that node
        const remote = {node: nodeToStoreOn, service: 'mem', method: 'put'};
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

        // Normalize configuration
        configuration = serialize({gid: context.gid, key: configuration});
        
        // Run the hashing algorithm on the KID and the NIDs
        const nodeID = context.hash(kid, nids);
        const nodeWithVal = Object.values(v).find(node => id.getNID(node) === nodeID);

        // Delete object by issuing a local.comm.send request
        const remote = {node: nodeWithVal, service: 'mem', method: 'del'};
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
      // EXTRA CREDIT
    },
  };
};

module.exports = mem;
