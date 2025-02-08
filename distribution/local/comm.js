/** @typedef {import("../types").Callback} Callback */
/** @typedef {import("../types").Node} Node */
const http = require('node:http');


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
function send(message, remote, callback) {
    
    // Send message by issuing HTTP PUT request to remote node
    const node = remote.node;
    const service = remote.service;
    const method = remote.method;

    // Create options
    const options = {
        hostname: node.hostname,        
        port: parsedUrl.port,          
        path: parsedUrl.pathname,       
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };
    
}

module.exports = {send};
