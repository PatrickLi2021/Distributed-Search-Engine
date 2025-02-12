const id = require('../util/id');
const log = require('../util/log');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: new Map(),
};

status.get = function(configuration, callback) {
  callback = callback || function() { };

  if (configuration === 'heapTotal' || configuration.includes('heapTotal')) {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  if (configuration == 'sid') {
    callback(null, global.moreStatus["sid"]);
    return;
  }
  if (configuration == 'nid') {
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

const distribution = require('@brown-ds/distribution')

status.spawn = distribution.local.status.spawn;

status.stop = distribution.local.status.stop;

module.exports = status;
