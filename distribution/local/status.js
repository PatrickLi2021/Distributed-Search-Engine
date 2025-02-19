const id = require('../util/id');
const log = require('../util/log');
const { util } = require("@brown-ds/distribution");
const { fork } = require('child_process');

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

status.spawn = function (configuration, callback) {
  // Create RPC from callback
  const callbackRPC = createRPC(callback);

  // Extend config to include RPC and serialize config
  if ("onStart" in configuration) {
    const originalOnStart = configuration.onStart;
    configuration.onStart = function () {
        originalOnStart();  
        callbackRPC();
    };
  }
  else {
    configuration["onStart"] = callbackRPC;
  }
  const configStr = util.serialize(configuration);

  // Fork and execute a new distribution.js process
  let child = fork('../../distribution.js', [configStr], {});
  return child;
},

status.stop = function (callback) {
    setTimeout(() => {
        if (global.distribution.node.server) {
            global.distribution.node.server.close(() => {
                console.log("Server has shut down.");
                if (callback) callback();
            });
        } else {
            console.log("No active server to stop.");
            if (callback) callback();
        }
    }, 1000);
};

module.exports = status;
