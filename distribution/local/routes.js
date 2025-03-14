/** @typedef {import("../types").Callback} Callback */

const { comm, groups, status, routes, gossip, mem, store, mr } = require("../all/all");


const serviceMap = new Map();
serviceMap.set('status', {});
serviceMap.set('routes', {});
serviceMap.set('comm', {});
serviceMap.set('rpc', global.moreStatus.toLocal);
serviceMap.set('mr', {'mr': mr});
serviceMap.set('all', {'status': status, 'routes': routes, 'comm': comm, 'gossip': gossip, 'mem': mem, 'store': store, 'mr': mr, 'groups': groups});


/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
  // Data parsing
  if (Array.isArray(configuration)) {
    configuration = configuration[0];
  }
  const gid = configuration.gid || 'local';
  const service = configuration.service || configuration;

  // Local service
  if (serviceMap.has(service) && gid === 'local') {
    return callback(null, serviceMap.get(service));
    // Distributed service

  } else if (gid != 'local') {
    return callback(null, serviceMap.get('all')[service](configuration));

  } else {
    // Handling RPC calls
    if (!(service in serviceMap)) {
      const rpc = global.toLocal[service];
      if (rpc) {
        callback(null, {call: rpc});
      } else {
        callback(new Error(`Service ${service} not found!`));
      }
    }
  }
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
  serviceMap.set(configuration, service);
  if (callback) {
    callback(null, service);
  }
  return;
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  if (serviceMap.has(configuration)) {
    serviceMap.delete(configuration);
    callback(null, configuration);
  } else {
    callback(new Error('Configuration not found in map'));
  }
  return;
};

module.exports = {get, put, rem};
