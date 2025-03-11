/** @typedef {import("../types").Callback} Callback */

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {any} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
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
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} cb
   * @return {void}
   * 
   * Notes: We assume that the dataset is already stored on the group of nodes running MR
   * 
   * 1. Need to distribute the map function (configuration.mapper) to all nodes in context.gid group
   *    - Each node exposes an RPC endpoint to accept the map function
   *    - The coordinator will invoke an RPC to send the map function and a subset of the keys and their values
   * 2. Send keys to all nodes (configuration.keys)
   * 3. Each mapper node will execute the mapper function on the subset of the data located on it
   * 4. 
   * 
   * 
   */
  function exec(configuration, cb) {


  }

  return {exec};
};

module.exports = mr;
