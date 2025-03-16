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
  function exec(configuration, execCallback) {
    // Initialize counter and aggregate variables to be used in the various phases
    let mappersDone = 0;
    let shufflersDone = 0;
    let reducersDone = 0;
    let mapResults = [];
    let nodesWithConfig = new Set();

    // Initialize GID and node config for the orchestrator node in the MR workflow
    configuration['gid'] = context.gid;
    configuration['execNode'] = global.nodeConfig;

    // Initialize map() wrapper in configuration
    configuration['mapWrapper'] = (configuration, jobID, callback) => {
      const originalMapFunc = configuration['map'];
      // Count how many keys exist on this node that are in the current MR workflow
      const getConfig = {key: null, gid: configuration['gid']};
      global.distribution.local.store.get(getConfig, (e, v) => {
        const numKeys = v.length;

        // Iterate over each key in this MR workflow ...
        const mapRes = [];
        v.forEach(key => {
          const getConfig = {key: key, gid: configuration['gid']};
          global.distribution.local.store.get(getConfig, (e, v) => {
            if (v) {
              // and call map() on this key-value pair (and flatten returned array)
              mapRes.push(...originalMapFunc(key, v));
            }
            if (mapRes.length == numKeys) {
              // Notify orchestrator that this node is done with its MapReduce
              const remote = {node: configuration['execNode'], service: jobID, method: 'notify'};
              global.distribution.local.comm.send([mapRes, jobID], remote, (e, v) => {
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

    configuration['reduceWrapper'] = (mapRes, cb) => {
      const originalReduceFunc = configuration['reduce'];
      const grouped = mapRes.reduce((acc, obj) => {
        const key = Object.keys(obj)[0]; 
        acc[key] = (acc[key] || []).concat(obj[key]);
        return acc;
      }, {});
      const reduceResult = [];
      for (const [key, values] of Object.entries(grouped)) {
        reduceResult.push(originalReduceFunc(key, values));
      }
      cb(null, reduceResult);
    };
    
    // Initialize notify in configuration
    configuration['notify'] = (mapRes, jobID, notifyCallback) => {
      mapResults.push(mapRes); // Aggregate intermediate map result
      mappersDone++; // Increment the number of mappers completed
      global.distribution.local.groups.get(configuration['gid'], (e, nodesInGroup) => {
        if (mappersDone === Object.keys(nodesInGroup).length) {
          mapResults = mapResults.flat(Infinity);
          // SKIP SHUFFLE PHASE FOR NOW AND JUST IMPLEMENT SINGLE REDUCER
          // Trigger the reducer function to run on the orchestrator
          console.log("MAP RESULTS: ", mapResults, global.nodeConfig.port);
          const remote = {node: configuration['execNode'], service: jobID, method: 'reduceWrapper'};
          global.distribution.local.comm.send([mapResults], remote, (e, v) => {
            if (e) {
              notifyCallback(new Error("Error executing reduce on node"), null);
              return;
            }
            notifyCallback(null, v);
          });
        }
      });
    };
   
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
          for (const [_, node] of Object.entries(groupNodes)) {
            // Have each worker node start executing map
            const remote = {node: node, service: jobID, method: 'mapWrapper'};
            global.distribution.local.comm.send([configuration, jobID], remote, (e, v) => {
              if (e) {
                execCallback(new Error("Error with worker node executing map"), null);
                return;
              }
              execCallback(null, v);
            });
          } 
        });
      });
    })
  }

  return {exec};
};

module.exports = mr;