const http = require('http');
const url = require('url');
const log = require('../util/log');
const routes = require('../local/routes');
const { deserialize } = require('../util/util');
// const distribution = require('@brown-ds/distribution');
// const distribution = global.distribution;
// const distribution = require('../../config.js')

/*
    The start function will be called to start your node. It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/
function getFirstItem(data) {
  while (Array.isArray(data) && data.length > 0) {
    data = data[0];
  }
  return data;
}


const start = function(callback) {
  const server = http.createServer((req, res) => {
    // Listen only for PUT requests
    if (req.method === 'PUT') {
      // The path determines the service to be used. The URL will have the form
      // http://node_ip:node_port/service/method
      const parsedUrl = url.parse(req.url, true);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      const gid = pathSegments[0];
      const service = pathSegments[1];
      const method = pathSegments[2];

      /*
        A common pattern in handling HTTP requests in Node.js is to have a
        subroutine that collects all the data chunks belonging to the same
        request. These chunks are aggregated into a body variable.
      */

      // Collect all the chunks belonging to the same request
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        let jsonData = deserialize(body);

        let config = {gid: gid, service: service};
        routes.get(config, (error, serviceMap) => {
          if (error) {
            res.statusCode = 404;
            res.end(serialize([new Error('Service not found'), null]));
            return;
          }
          if (serviceMap && method in serviceMap) {
            const functionToCall = serviceMap[method];
            functionToCall(...jsonData, (error, value) => {
              res.end(serialize([error, value]));
            });

          } else {
            res.statusCode = 404;
            res.end(serialize([new Error('Service or method not found'), null]));
          }
        });
        
      });
    } 
  });

  /*
    Your server will be listening on the port and ip specified in the config.
    You'll be calling the `callback` callback when your server has successfully
    started.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
