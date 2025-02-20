/** @typedef {import("../types").Callback} Callback */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
 * @param {Array} message
 * @param {object} configuration
 * @param {Function} callback
 */
  function send(message, configuration, callback) {
    let counter = 0;
    const values = {};
    const errors = {};

    // Retrieve all nodes in group
    distribution.local.groups.get(context.gid, (err, groupNodes) => {
      if (err) {
        return callback(err, null);
      }
      const totalNodes = Object.keys(groupNodes).length;
      if (totalNodes === 0) {
        return callback(null, values);
      }

      // For each node in the group, send a message
      for (const nodeID in groupNodes) {
        const nodeConfig = groupNodes[nodeID]; // nodeConfig = {ip, port}
        const remote = {node: nodeConfig, ...configuration};

        distribution.local.comm.send(message, remote, (e, v) => {
          if (e) {
            errors[nodeID] = e;
          } else {
            values[nodeID] = v;
          }
          counter++;

          // When all responses have been received, call the final callback
          if (counter === totalNodes) {
            callback(errors, values);
            return;
          }
        });
      }
    });
  }


  return {send};
};

module.exports = comm;
