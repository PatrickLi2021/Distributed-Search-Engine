const distribution = require('@brown-ds/distribution');
const log = require('../util/log');
const crypto = require('crypto');


const nodeIP = global.nodeConfig.ip;
const nodePort = global.nodeConfig.port;
const node = {ip: String(nodeIP), port: nodePort};

function createRPC(func) {
  // func is by default asynchronous
  if (typeof func !== 'function') {
    return new Error('createRPC expects a function as input');
  }

  // Add function to toLocal
  const remotePointer = crypto.randomBytes(16).toString('hex');
  global.moreStatus.toLocal.set(remotePointer, func); // stores string hashes to actual functions

  // Create RPC stub and return it
  function stub(...args) {
    const callback = args.pop();
    args = args.map((arg) => distribution.util.serialize(arg)); 

    if (typeof callback !== 'function') {
      return new Error('The last argument must be a callback function');
    }

    const remote = { node: `${node}`, service: `${remotePointer}`, method: 'call' };

    // Send serialized args to node where func resides
    distribution.local.comm.send(args, remote, (error, response) => {
      if (error) {
        callback(error);
      } else {
        callback(null, response);
      }
    });
  }
  console.log("finished createRPC");
  return stub;
}

/*
  The toAsync function transforms a synchronous function that returns a value into an asynchronous one,
  which accepts a callback as its final argument and passes the value to the callback.
*/
function toAsync(func) {
  log(`Converting function to async: ${func.name}: ${func.toString().replace(/\n/g, '|')}`);

  // It's the caller's responsibility to provide a callback
  const asyncFunc = (...args) => {
    const callback = args.pop();
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };

  /* Overwrite toString to return the original function's code.
   Otherwise, all functions passed through toAsync would have the same id. */
  asyncFunc.toString = () => func.toString();
  return asyncFunc;
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};
