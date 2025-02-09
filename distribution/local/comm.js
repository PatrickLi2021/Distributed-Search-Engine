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
    
    const data = JSON.stringify(message);

    // Create options
    const options = {
        hostname: remote.node.ip,        
        port: remote.node.port,          
        path: `/${remote.service}/${remote.method}`,       
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
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
            if (responseData) {
                let parsed;
                try {
                    parsed = JSON.parse(responseData);
                } catch (err) {
                    return callback(new Error("Invalid JSON response from server"), null);
                }
        
                if (res.statusCode >= 400) {
                    callback(new Error(parsed.error || `Request failed with status ${res.statusCode}`), null);
                } else {
                    callback(null, parsed);
                }
            } else {
                callback(new Error("No data received from server"), null);
            }
        });
    });

    // Handle request errors
    req.on('error', (err) => {
        if (callback) {
            callback(err, null);
        }
    });

    // Send the request with data
    req.write(data);
    req.end();
}

module.exports = {send};
