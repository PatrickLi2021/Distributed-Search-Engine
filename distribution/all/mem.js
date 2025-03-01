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
          const remote = { service: 'mem', method: 'get' };
          global.distribution[context.gid].comm.send([configuration], remote, (e, v) => {            
            if (e instanceof Error) {
              callback(new Error("Could not get object"), null);
              return;
            }

            let extractedKeys = [];
            Object.values(v).forEach(valueArray => {
              extractedKeys = [...extractedKeys, ...valueArray];
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
        configuration = {gid: context.gid, key: configuration};
      }
      else if (configuration === null) {
        configuration = {gid: context.gid, key: id.getID(state)};
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
        configuration = {gid: context.gid, key: configuration};
        
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
      // Initialize a map to store mappings from key to old node ID (to be used for comparison)
      const keyToOldNode = new Map();
      
      // Fetch the NIDs of the old state of the group
      const oldGroupNIDs = [];
      const oldNIDToNode = {};
    
      Object.entries(configuration).forEach(([sid, node]) => {
        const nid = id.getNID(node);
        oldGroupNIDs.push(nid); 
        oldNIDToNode[nid] = node; 
      });
    
      // Get the list of object keys available in the service instance
      global.distribution[context.gid].mem.get(null, (e, keys) => {
        if (e instanceof Error) {
          callback(new Error("Could not get all keys"), null);
          return;
        }
    
        // Get the nodes of the new state of the group
        global.distribution.local.groups.get(context.gid, (e, newGroupNodes) => {
          if (e) {
            callback(new Error("Could not get nodes for new group"), null);
            return;
          }
    
          // Populate new node mappings
          const newGroupNIDs = [];
          const newNIDToNode = {};
    
          Object.values(newGroupNodes).forEach(node => {
            const nid = id.getNID(node);
            newGroupNIDs.push(nid); 
            newNIDToNode[nid] = node;
          });
    
          // Determine keys that need relocation
          let keysToRelocate = {};
          keys.forEach(key => {
            const oldNid = context.hash(id.getID(key), oldGroupNIDs);
            const newNid = context.hash(id.getID(key), newGroupNIDs);
    
            if (oldNid !== newNid) {
              keysToRelocate[key] = { oldNode: oldNIDToNode[oldNid], newNode: newNIDToNode[newNid] };
            }
          });
    
          let numRelocated = 0;
          Object.keys(keysToRelocate).forEach(key => {
            const nodeToGetFrom = keysToRelocate[key].oldNode;
            const message = [{ key: key, gid: context.gid }];
            const remote = { method: "get", service: "mem", node: nodeToGetFrom };
    
            global.distribution.local.comm.send(message, remote, (e, obj) => {
              if (e) {
                callback(e, null);
                return;
              }
    
              // Delete from old node
              const delMessage = [{ key: key, gid: context.gid }];
              const delRemote = { node: nodeToGetFrom, method: "del", service: "mem" };
              global.distribution.local.comm.send(delMessage, delRemote, (e, v) => {
                if (e) {
                  callback(e, null);
                  return;
                }
    
                // Put on new node
                const putMessage = [obj, { key: key, gid: context.gid }];
                const putRemote = { node: keysToRelocate[key].newNode, method: "put", service: "mem" };
                global.distribution.local.comm.send(putMessage, putRemote, (e, v) => {
                  if (e) {
                    callback(e, null);
                    return;
                  }
                  numRelocated++;
                  if (numRelocated === Object.keys(keysToRelocate).length) {
                    callback(null, v);
                  }
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
