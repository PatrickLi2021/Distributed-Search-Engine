// const log = require('../util/log');
const { createRPC, toAsync } = require("../util/wire");
const path = require('path');
const { spawn } = require('node:child_process');
const { serialize } = require('../util/serialization')
const { exit } = require('node:process');

const status = {};

global.moreStatus = {
  sid: global.distribution.util.id.getSID(global.nodeConfig),
  nid: global.distribution.util.id.getNID(global.nodeConfig),
  counts: 0,
  toLocal: new Map(),
  receivedMessages: new Set(),
  
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
    callback(null, global.moreStatus['sid']);
    return;
  }
  if (configuration == 'nid') {
    callback(null, global.moreStatus['nid']);
    return;
  }
  if (configuration === 'counts') {
    callback(null, global.moreStatus['counts']);
    return;
  }
  if (configuration === 'port') {
    callback(null, global.nodeConfig['port']);
    return;
  }
  if (configuration === 'ip') {
    callback(null, global.nodeConfig['ip']);
    return;
  }
  callback(new Error('Status key not found'), null);
};

// status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn;

// MY IMPLEMENTATION OF SPAWN
status.spawn = function(configuration={}, callback) {
  
  // Create RPC stub to put into function
  const RPCstub = createRPC(toAsync(callback));
  const serializedRPC = serialize(RPCstub);

  // Extract original onStart from config
  const onStart = configuration.onStart || (() => {});
  let onStartFunc = "let onStart = " + onStart.toString() + ";onStart();\n";
  onStartFunc = onStartFunc.replace(/[\x00-\x1F\x7F\x80-\x9F]/g, ''); // remove command chars

  const sendIndex = serializedRPC.indexOf('distribution.local.comm');
  let newSerializedRPC = serializedRPC.substring(0, sendIndex) + onStartFunc + serializedRPC.substring(sendIndex);

  let nargs = "[null, {ip: __IP__, port: __PORT__}];";
  nargs = nargs.replace("__IP__", "\\\"" + configuration.ip + "\\\"").replace("__PORT__", configuration.port);

  empty_callback = (e, v) => {};
  let serializedCback = serialize(empty_callback);
  serializedCback = serializedCback.replace("{\"type\":\"function\",\"value\":", "").substring(1, serializedCback.length-2);

  newSerializedRPC = newSerializedRPC.replace("args.pop()", "()=>{}").replace("let message = args;", "let message = " + nargs);

  const stub = deserialize(newSerializedRPC);
  configuration['onStart'] = stub;

  let options = {'cwd': path.join(__dirname, '../..'), 'detached': true, 'stdio': 'inherit'};
  spawn('node', ['distribution.js', '--config='+serialize(configuration)], options);
};

// status.stop = require('@brown-ds/distribution/distribution/local/status').stop;

status.stop = function (callback) {
  callback(null, global.nodeConfig);
  global.distribution.node.server.close();
  setTimeout(() => { exit(0)}, 0.5);
};

module.exports = status;
