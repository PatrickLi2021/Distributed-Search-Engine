const id = require('../util/id');
const log = require('../util/log');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() { };

  if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  if (Array.isArray(configuration) && configuration.includes('sid')) {
    callback(null, global.moreStatus["sid"]);
    return;
  }
  if (Array.isArray(configuration) && configuration.includes('nid')) {
    callback(null, global.moreStatus["nid"]);
    return;
  }
  if (configuration === 'counts') {
    callback(null, global.moreStatus["counts"]);
    return;
  }
  if (configuration === 'port') {
    callback(null, global.nodeConfig["port"]);
    return;
  }
  if (configuration === 'ip') {
    callback(null, global.nodeConfig["ip"]);
    return;
  }
  callback(new Error('Status key not found'), null);
};


status.spawn = function(configuration, callback) {
};

status.stop = function(callback) {
};

module.exports = status;
