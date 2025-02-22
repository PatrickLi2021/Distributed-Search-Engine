const {id} = require('../util/util');

const groups = {}; // map from node group names to sets of nodes. Each set is a map from SID to node objects

/*
* This function can be used to get the IP and port info of all nodes in a particular group.
*/
groups.get = function(name, callback) {
  if (name in groups) {
    callback(null, groups[name]);
  } else {
    callback(new Error('Group name not found'), null);
  }
  return;
};

groups.put = function(config, group, callback) {
  // Put mapping of group name to node set in map
  if (typeof(config) === 'object' && 'gid' in config) {
    config = config['gid'];
  }
  groups[config] = group;
  // Instantiate distribution.gid object and attach distributed version of each service to that object
  global.distribution[config] = {};
  global.distribution[config].status = require('../all/status')({gid: config});
  global.distribution[config].comm = require('../all/comm')({gid: config});
  global.distribution[config].gossip = require('../all/gossip')({gid: config});
  global.distribution[config].groups = require('../all/groups')({gid: config});
  global.distribution[config].routes = require('../all/routes')({gid: config});
  global.distribution[config].mem = require('../all/mem')({gid: config});
  global.distribution[config].store = require('../all/store')({gid: config});
  if (typeof callback === 'function') {
    callback(null, groups[config]);
  }
  return;
};

groups.del = function(name, callback) {
  if (!(name in groups)) {
    callback(new Error('Group name not in map'), null);
  } else {
    const nodeSet = groups[name];
    delete groups[name];
    callback(null, nodeSet);
  }
  return;
};

groups.add = function(name, node, callback) {
  if (!(name in groups)) {
    return callback(null, node);
  }
  groups[name][id.getSID(node)] = node;
  if (typeof callback === 'function') {
    callback(null, node);
  }
  return;
};

groups.rem = function(name, node, callback) {
  if (!(name in groups)) {
    return callback(null, name);
  } else if (!(node in groups[name])) {
    return callback(new Error('Node not in group'), null);
  }
  delete groups[name][node];
  if (typeof callback === 'function') {
    callback(null, node);
  }
  return;
};

module.exports = groups;
