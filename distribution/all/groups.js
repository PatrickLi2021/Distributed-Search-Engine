const distribution = require("@brown-ds/distribution");

const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    put: (config, group, callback) => {
      // Go through every node in the group and run the local groups.put method on each node

    },

    del: (name, callback) => {
    },

    // Collect results from calling groups.get on all nodes that local node thinks are in the group
    get: (name, callback) => {

    },

    add: (name, node, callback) => {
    },

    rem: (name, node, callback) => {
    },
  };
};

module.exports = groups;
