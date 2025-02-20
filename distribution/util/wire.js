const log = require('../util/log');
const crypto = require('crypto');


// const nodeIP = global.nodeConfig.ip;
// const nodePort = global.nodeConfig.port;
// const node = {ip: String(nodeIP), port: nodePort};

let createRPC = require('@brown-ds/distribution/distribution/util/wire').createRPC;

// MY IMPLEMENTATION OF CREATERPC
// {
//   // func is by default asynchronous
//   if (typeof func !== 'function') {
//     return new Error('createRPC expects a function as input');
//   }

//   // Add function to toLocal
//   const remotePointer = crypto.randomBytes(16).toString('hex');
//   global.moreStatus.toLocal.set(remotePointer, func); 

//   // Create RPC stub and return it
//   function stub(...args) {
//     const callback = args.pop();

//     if (typeof callback !== 'function') {
//       return new Error('The last argument must be a callback function');
//     }

//     const remote = { node: '__NODE_INFO__', service: 'rpc', method: '__HASH__' };
//     let message = args;
//     console.log("IN STUB, MESSAGES: ", message);
//     // Send serialized args to node where func resides
//     distribution.local.comm.send(message, remote, (error, response) => {
//       if (error) {
//         callback(error);
//       } else {
//         callback(null, response);
//       }
//     });
//   }
//   let serializedStub = distribution.util.serialize(stub);
//   serializedStub = serializedStub.replace("'__NODE_INFO__'", "{'ip':'" + global.nodeConfig.ip.toString() + "', 'port': " + global.nodeConfig.port.toString() + "}");
//   serializedStub = serializedStub.replace("'__HASH__'", "'" + remotePointer + "'");
//   console.log("DESERIALIZED STUB: ", distribution.util.deserialize(serializedStub).toString());
//   return distribution.util.deserialize(serializedStub);
// }

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
