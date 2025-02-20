/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */
// const distribution = require("@brown-ds/distribution");
// const distribution = global.distribution;
const http = require('node:http');
const {serialize} = require('../util/serialization');


/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 */

/**
 * @param {Array} message
 * @param {Target} remote
 * @param {Callback} [callback]
 * @return {void}
 */
function send(message=[], remote, callback) {
  const data = serialize(message);

  // Create options
  const options = {
    hostname: remote.node.ip,
    port: remote.node.port,
    path: `/${remote.gid || 'local'}/${remote.service}/${remote.method}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  };
  // Create the HTTP request
  const req = http.request(options, (res) => {
    let responseData = '';

    // Collect response data
    res.on('data', (chunk) => {
      responseData += chunk;
    });

    // Handle end of response
    res.on('end', () => {
        let parsed = deserialize(responseData)
        callback(...parsed);
    }
    );
  });

  // Handle request errors
  req.on('error', (err) => {
    callback(err, null);
  });

  // Send the request with data
  req.write(data);
  req.end();
}

module.exports = {send};
