const { serialize } = require("../util/serialization");
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

        if (configuration.key === null) {
          const remote = { service: 'mem', method: 'get'};
          const extractedKeys = [];
          global.distribution[context.gid].comm.send([configuration], remote, (e, v) => {            
            if (e instanceof Error) {
              callback(new Error("Could not get object"), null);
              return;
            }
            const extractedKeys = [];
            Object.values(v).forEach(valueArray => {
              valueArray.forEach(serializedStr => {
                  if (typeof serializedStr !== 'string') return;
                      const deserializedObj = deserialize(serializedStr); 
                      if (deserializedObj && deserializedObj.key) {  
                        extractedKeys.push(deserializedObj.key);
                      }
              });
          });
            callback({}, extractedKeys);
          });
        }

        else {
          // Retrieve value by issuing a local.comm.send request
          const remote = {node: nodeWithVal, service: 'mem', method: 'get'};
          global.distribution.local.comm.send([configuration], remote, (e, v) => {
            if (e) {
              callback(new Error("Could not get object"), null);
              return;
            }
            callback(null, v);
          });
      };
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


    /*
    Parameters:
    - configuration: an object that represents the previous state of the group. It will look something like
      {sid1: {ip: '127.0.0.1', port: 9001}, sid2: {ip: '127.0.0.1', port: 9002}, ...} 
    - callback: a callback function
    */
    reconf: (configuration, callback) => {
      // Initialize a map to store mappings from key to old node ID and new node ID (to be used for comparison)
      const keyToOldNode = new Map();
      const keyToNewNode = new Map();
      
      // Fetch the NIDs of the old state of the group
      const oldGroupNIDs = Object.values(configuration).map(node => id.getNID(node));
      const oldNIDToNode = new Map();
      Object.entries(configuration).forEach(([sid, node]) => {
        oldGroupNIDs.push(id.getNID(node)); 
        oldNIDToNode.set(id.getNID(node), node);
      });
      
      // Get the list of object keys available in the service instance
      global.distribution[context.gid].mem.get(null, (e, keys) => {
        if (e) {
          callback(new Error("Could not get all keys"), null);
          return;
        }
        let keysToRelocate = [];
        
        // Get the nodes of the new state of the group
        global.distribution.local.groups.get(context.gid, (err, newGroupNodes) => {
          if (err) {
            callback(new Error("Could not get nodes for new group"), null);
            return;
          }
          // Go through the keys we retrieved from get(null) and calculate the node they USED to be on
          keys.forEach(key => {
            const kid = id.getID(key);
            const oldNodeID = context.hash(kid, oldGroupNIDs);
            keyToOldNode.set(key, oldNodeID);
          });
          const newGroupNIDs = Object.values(newGroupNodes).map(node => id.getNID(node));
          
          // Using the new group NIDs, calculate the NEW node (if there is a new node) that each key should be placed on
          // Store a list of keys to be relocated
          keys.forEach(key => {
            const kid = id.getID(key, newGroupNIDs);
            const newGroupID = context.hash(kid, newGroupNIDs);
            if (keyToOldNode.get(key) !== newGroupID) {
              keysToRelocate.push(key);
            }
          });

          // For each key to be relocated, we...delete it from that old node, and put it on the new node
          keysToRelocate.forEach(key => {
            const nodeToGetFrom = oldNIDToNode[keyToOldNode[key]]; // calculates the old node this key was on
            // Get the object from the old node...
            const remote = {node: nodeToGetFrom, service: "mem", method: "get"};
            global.distribution.local.comm.send([key], remote, (e, obj) => {
              // Delete that key from the old node...
              const remote = {node: nodeToGetFrom, service: "mem", method: "del"};
              global.distribution.local.comm.send([key], remote, (e, v) => { 
                // Call all.put to put object on new node in updated group
                global.distribution[context.gid].put(obj, key, (e, v) => {
                  if (e) {
                    callback(new Error("Could not put key on node"), null);
                    return;
                  }
                  callback(null, v);
                });
              });
            });
          });
        });
      });
    },
  };
};

module.exports = mem;
