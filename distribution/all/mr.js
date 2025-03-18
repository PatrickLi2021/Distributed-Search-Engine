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
   * @property {Function} [compact] // Optional
   */
  function exec(configuration, execCallback) {
    // Initialize counter and aggregate variables to be used in the various phases
    let mappersDone = 0;
    let totalDone = 0;
    let reducersDone = 0;
    let mapResults = [];

    // Initialize GID and node config for the orchestrator node in the MR workflow
    configuration['gid'] = context.gid;
    configuration['execNode'] = global.nodeConfig;

    // Initialize map() wrapper in configuration
    configuration['mapWrapper'] = (configuration, jobID, mapCallback) => {
      const originalMapFunc = configuration['map'];
      const compactFunc = configuration['compact'];
      // Count how many keys exist on this worker node that are in the current MR workflow
      const getConfig = {key: null, gid: configuration['gid']};
      let mapRes = [];
      global.distribution.local.store.get(getConfig, (e, v) => {
        const numKeys = v.length;
        // Iterate over each key in this MR workflow
        let completedKeys = 0;  // Track number of keys fully processed
        v.forEach(key => {
          const getConfig = { key: key, gid: configuration['gid'] };
          global.distribution.local.store.get(getConfig, (e, v) => {
            if (v) {
              let mapOutput = originalMapFunc(key, v);
              mapRes.push(mapOutput);
              if (compactFunc) {
                mapRes = compactFunc(mapRes);
              }
              let mapOutputKeys = 0;
              // Apply compaction function if provided
              mapOutput.forEach((item) => {
                const key = Object.keys(item)[0];
                const value = Object.values(item)[0];
        
                global.distribution['reduceGroup'].store.append(value, key, (e, v) => {
                  mapOutputKeys++;
                  if (e) {
                    mapCallback(new Error("Issue appending key to new node"), null);
                    return;
                  }
                  
                  if (mapOutputKeys === mapOutput.length) {
                    completedKeys++;
                    if (completedKeys === numKeys) { 
                      const remote = { node: configuration['execNode'], service: jobID, method: 'notify' };
                      global.distribution.local.comm.send([mapRes, jobID], remote, (e, v) => {
                        if (e) {
                          mapCallback(new Error("Error sending notify for map"), null);
                        }
                        mapCallback(null, v);
                      });
                    }
                  }
                });
              });
            }
          });
        });
        if (v.length === 0) {
          // If this node was in the group but had no keys put on it, we still want to call notify, just with an empty
          // intermediate map result (because it had no keys to work with)
          const remote = {node: configuration['execNode'], service: jobID, method: 'notify'};
          global.distribution.local.comm.send([mapRes, jobID], remote, (e, v) => {
            if (e) {
              mapCallback(new Error("Error sending notify for map"), null);
            }
            mapCallback(null, v);
            return;
          });
        }
      });
    }

    configuration['reduceWrapper'] = (configuration, reduceCallback) => {
      const originalReduceFunc = configuration['reduce']; // Store the original, pure reduce function
      // Retrieve all the keys SOLELY USED FOR REDUCE on this node (from the reduceGroup)
      const getConfig = {key: null, gid: 'reduceGroup'};
      global.distribution.local.store.get(getConfig, (e, keys) => {
        // Iterate over each key and retrieve the list of value(s)
        const numKeys = keys.length;
        let keysToReduce = 0;
        let reduceRes = [];
        keys.forEach(key => {
          const getConfig = {key: key, gid: 'reduceGroup'};
          global.distribution.local.store.get(getConfig, (e, valueArr) => {
            keysToReduce++;
            if (e) {
              reduceCallback(new Error("Error retrieving values associated with key"), null);
              return;
            }
            reduceRes.push(originalReduceFunc(key, valueArr));
            if (numKeys === keysToReduce) {
              reduceCallback(null, reduceRes);
            }
          });
        });
        if (keys.length === 0) {
          // If this node was in the group but had no keys put on it, we still want to call notify, just with an empty
          // reduce result (because it had no keys to work with)
          reduceCallback(null, keys);
          return;
        }
      });
    };
    
    // Initialize notify in configuration
    configuration['notify'] = (mapRes, jobID, notifyCallback) => {
      mappersDone++; // Increment the number of mappers completed
      mapResults.push(mapRes); // Aggregate intermediate map result
      global.distribution.local.groups.get(configuration['gid'], (e, nodesInGroup) => {
        // We're done with map on all worker nodes at this point
        if (mappersDone === Object.keys(nodesInGroup).length) {
          mapResults = mapResults.flat(Infinity);
          // Once we're done shuffling all items from the map result, trigger reduce to run on each worker node
          // WITHIN THE NEW GROUP
          global.distribution.local.groups.get('reduceGroup', (e, reduceGroupNodes) => {
            if (e) {
              notifyCallback(new Error("Couldn't get nodes in reduce group"), null);
              return;
            }
            const reduceResults = [];
            for (const [_, node] of Object.entries(reduceGroupNodes)) {
              const remote = {node: node, service: jobID, method: 'reduceWrapper'};
              global.distribution.local.comm.send([configuration], remote, (e, partialReduceVal) => {
                if (e) {
                  notifyCallback(new Error("Error executing reduce on node"), null);
                  return;
                }
                reducersDone++;
                reduceResults.push(partialReduceVal);
                if (reducersDone === Object.keys(reduceGroupNodes).length) {
                  notifyCallback(null, reduceResults);
                }
              });
            }
          });
        };
      }
    )}
   
    const jobID = 'mr-' + crypto.randomUUID();

    // Register mr workflow locally (AKA on the orchestrator node)
    global.distribution.local.routes.put(configuration, jobID, (e, v) => {
      if (e) {
        callback(new Error("Could not get nodes"), null);
        return;
      }
        // Call all.routes.put to register the MR config on each node in this group
        global.distribution[configuration['gid']].routes.put(configuration, jobID, (e, v) => {
          // Get all the nodes in the group
          global.distribution.local.groups.get(configuration['gid'], (e, groupNodes) => {
            // Once we have all the nodes in the group, register the reduceGroup on this node, to be used in the 
            // shuffle and reduce phases later
            global.distribution.local.groups.put('reduceGroup', groupNodes, (e, v) => {
              // Register reduceGroup on all nodes in this group
              global.distribution.reduceGroup.groups.put('reduceGroup', groupNodes, (e, v) => {
                for (const [_, node] of Object.entries(groupNodes)) {
                  // Have each worker node start executing map
                  const remote = {node: node, service: jobID, method: 'mapWrapper'};
                  global.distribution.local.comm.send([configuration, jobID], remote, (e, v) => {
                    if (totalDone == 0) { // this ensures that we only execute the execCallback once
                      totalDone++;
                      if (e) {
                        execCallback(new Error("Error with worker node executing map"), null);
                        return;
                      }
                      v = v.flat().filter(item => Object.keys(item).length > 0);
                      execCallback(null, v);
                  }
                });
              } 
            });
          });
        });
      })
    });
  }
  return {exec};
};

module.exports = mr;