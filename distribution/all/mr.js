/** @typedef {import("../types").Callback} Callback */

const crypto = require('crypto');
const { id } = require("../util/util");
/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @param {any} key
 * @param {Array} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 */

/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

function mr(config) {
  const context = {
    gid: config.gid || 'all',
    hash: config.hash || global.distribution.util.id.naiveHash,
  };


  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   * 
   */
  function exec(configuration, cb) {
    // Initialize counter and aggregate variables to be used in the various phases
    let mappersDone = 0;
    let shufflersDone = 0;
    let reducersDone = 0;
    let mapResults = [];
    let reduceResults = [];
    let nodesWithConfig = new Set();

    // Initialize shuffle function in config
    configuration['shuffle'] = (mapRes) => {
      let valuesToShuffle = 0;
      for (const [key, value] of Object.entries(mapRes)) {
        // Use store.all.put to put key + value on appropriate node (AKA shuffle this key)
        global.distribution[configuration['gid']].store.put(value, key, (e, v) => {
          valuesToShuffle++;
          if (valuesToShuffle === Object.keys(mapRes).length) {
            // Notify orchestrator that this node is done with shuffling
            const remote = {node: configuration['execNode'], service: jobID, method: 'notify'};
            global.distribution.local.comm.send([[], jobID, 'shuffle'], remote, (e, v) => {
              if (e) {
                callback(new Error("Error sending notify for shuffle"), null);
              }
              callback(null, v);
            });
          }
        });
      };
    };  

    // Initialize map() wrapper in configuration
    configuration['mapWrapper'] = (configuration, jobID, callback) => {
      const originalMapFunc = configuration['map'];
      // Get the number of keys that exist on this node
      const getConfig = {key: null, gid: configuration['gid']};
      global.distribution.local.store.get(getConfig, (e, v) => {
        const numKeys = v.length;
        // Iterate over each key on this node
        const mapRes = [];
        v.forEach(key => {
          const remote = {node: global.nodeConfig, service: 'store', method: 'get'};
          const getConfig = {key: key, gid: configuration['gid']};
          // Retrieve the value associated with the given key
          global.distribution.local.comm.send([getConfig], remote, (e, v) => {
            if (v) {
              // Call map on this key-value pair
              mapRes.push(originalMapFunc(key, v));
            }
            if (mapRes.length == numKeys) {
              // Notify orchestrator that this node is done with its MapReduce
              const remote = {node: configuration['execNode'], service: jobID, method: 'notify'};
              global.distribution.local.comm.send([mapRes, jobID, 'map'], remote, (e, v) => {
                if (e) {
                  callback(new Error("Error sending notify for map"), null);
                }
                callback(null, v);
              });
            }
          });
        });
      });
    }

    configuration['reduceWrapper'] = (cb) => {
      const originalReduceFunc = configuration['reduce'];
      const reduceValues = [];
      const reduceRes = [];
      global.distribution.local.store.get(null, (e, v) => {
        const numKeys = v.length;
        // For each key on this node, get the value associated with this key
        v.forEach(key => {
          const remote = {node: global.nodeConfig, service: 'store', method: 'get'};
          const getConfig = {key: key, gid: configuration['gid']};
          // Retrieve the value associated with the given key
          global.distribution.local.comm.send([getConfig], remote, (e, v) => {
            reduceValues.push(v);
            if (reduceValues.length === numKeys) {
              const grouped = reduceValues.reduce((acc, obj) => {
                const key = Object.keys(obj)[0]; 
                acc[key] = (acc[key] || []).concat(obj[key]);
                return acc;
              }, {});
              for (const [key, values] of Object.entries(grouped)) {
                reduceRes.push(originalReduceFunc(key, values));
              }
              // Notify orchestrator that this node is done with its reduce job
              const remote = {node: configuration['execNode'], service: jobID, method: 'notify'};
              global.distribution.local.comm.send([reduceRes, jobID, 'reduce'], remote, (e, v) => {
                if (e) {
                  callback(new Error("Error sending notify for map"), null);
                }
                callback(null, v);
              });
            }
          });
        });
      });
      };
    
    // Initialize notify in configuration
    configuration['notify'] = (partialRes, phase, jobID, cb) => {
      if (phase === 'map') {
        // Update the cumulative map result and increment the number of worker nodes that are done with map
        mapResults.push(partialRes);
        mappersDone++;
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (mappersDone === nodesWithConfig.size) {
            mapResults = mapResults.flat(Infinity);
            
            // Go through all nodes in this group. If they have keys to shuffle, then call shuffle on that node
            for (const [_, node] of Object.entries(v)) {
              if (nodesWithConfig.has(id.getNID(node))) {
                const remote = {node: value, service: jobID, method: 'shuffle'};
                global.distribution.local.comm.send([partialRes], remote, (e, v) => {
                  if (e) {
                    cb(new Error("Error with shuffle on node", null));
                    return;
                  }
                  cb(null, v);
                });
              }
            }
          }
        });
      }
      else if (phase === 'shuffle') {
        // shuffle phase
        shufflersDone++;
        global.distribution.local.groups.get(context.gid, (e, v) => {
        if (shufflersDone === nodesWithConfig.size) {
            // Go through all nodes in this group. If they have keys to reduce, then call reduce on that node
            for (const [_, node] of Object.entries(v)) {
              if (nodesWithConfig.has(id.getNID(node))) {
                const remote = {node: value, service: jobID, method: 'reduceWrapper'};
                global.distribution.local.comm.send([], remote, (e, v) => {
                  if (e) {
                    cb(new Error("Error with reduce on node", null));
                    return;
                  }
                  cb(null, v);
                });
              }
            }
        }
      });
      }
      else {
        reducersDone++;
        reduceResults.push(partialRes);
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (reducersDone === nodesWithConfig.size) {
            // Return final reduced output
            cb(null, reduceResults);
          }
        });
      }
    };

    // Initialize other parameters in configuration
    configuration['gid'] = context.gid;
    configuration['execNode'] = global.nodeConfig;
   
    // Get keys to be used for this MapReduce workflow and create mr endpoint
    const keys = configuration.keys; 
    const jobID = 'mr-' + crypto.randomUUID();

    // Register mr workflow locally (AKA on the orchestrator node)
    global.distribution.local.routes.put(configuration, jobID, (e, v) => {
      keys.forEach(key => {
        const kid = id.getID(key);

        // Retrieve all nodes in the orchestrator's view of the group
        global.distribution.local.groups.get(context.gid, (e, v) => {
          if (e) {
            callback(new Error("Could not get nodes"), null);
            return;
          }
          const nids = Object.values(v).map(node => id.getNID(node));
          
          // Run the hashing algorithm on the KID and the NIDs
          const nodeID = context.hash(kid, nids);
          const nodeToPut = Object.values(v).find(node => id.getNID(node) === nodeID);

          if (!nodesWithConfig.has(id.getNID(nodeToPut))) {
            // Register mr workflow on the worker node possessing the key
            const remote = {node: nodeToPut, service: 'routes', method: 'put'};
            global.distribution.local.comm.send([configuration, jobID], remote, (e, v) => {
              // Add nodeToPut's NID to the set so that we don't put the config (and execute map) twice on this node
              nodesWithConfig.add(id.getNID(nodeToPut));
              if (e) {
                cb(new Error("Could not send mr config to node"), null);
                return;
              }
              // Have worker node start executing map()
              const remote = {node: nodeToPut, service: jobID, method: 'mapWrapper'};
              global.distribution.local.comm.send([configuration, jobID], remote, (e, v) => {
                cb(null, v);
              });
            });
          }
        });
    });
    })
  }

  return {exec};
};

module.exports = mr;
