const { id } = require("../util/util");

function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;

  /* For the distributed store service, the configuration will always be a string */

  return {
    get: (configuration, callback) => {
      if (configuration === null) {
        const remote = {service: "store", method: "get"};
        const message = [{key: null, gid: context.gid}];
        global.distribution[context.gid].comm.send(message, remote, (e, v) => {
          let keys = [];
          for (let val of Object.values(v)) {
            keys = [...keys, ...val];
          }
          callback(e, keys);
          return;
        });
      } else {
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

        // Normalize configuration
        configuration = {key: configuration, gid: context.gid};

        global.distribution.local.comm.send([configuration], remote, (e, v) => {
          
          if (e instanceof Error ) {
            callback(new Error("Could not get object"), null);
            return;
          }
          else {
            if (configuration.key == null) {
              callback({}, v);
              return;
            } else {
              callback(null, v);
              return;
            }
          }
        });
      });
    }
  },    
    
  append: (state, configuration, callback) => {    
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
      configuration = {gid: configuration.gid || context.gid, key: configuration, node: nodeToStoreOn };

      // Call local.comm.send to invoke append on that node
      const remote = {node: nodeToStoreOn, service: 'store', method: 'append'};
      global.distribution.local.comm.send([state, configuration], remote, (e, v) => {
        if (e) {
          callback(new Error("Could not put object on node"), null);
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

        // Call local.comm.send to invoke store on that node
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

        // Normalize configuration
        configuration = {key: configuration, gid: context.gid};

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
      global.distribution[context.gid].store.get(null, (e, keys) => {
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
            const remote = { method: "get", service: "store", node: nodeToGetFrom };
    
            global.distribution.local.comm.send(message, remote, (e, obj) => {
              if (e) {
                callback(e, null);
                return;
              }
    
              // Delete from old node
              const delMessage = [{ key: key, gid: context.gid }];
              const delRemote = { node: nodeToGetFrom, method: "del", service: "store" };
              global.distribution.local.comm.send(delMessage, delRemote, (e, v) => {
                if (e) {
                  callback(e, null);
                  return;
                }
    
                // Put on new node
                const putMessage = [obj, { key: key, gid: context.gid }];
                const putRemote = { node: keysToRelocate[key].newNode, method: "put", service: "store" };
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

module.exports = store;
