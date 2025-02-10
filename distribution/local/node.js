const http = require('http');
const url = require('url');
const log = require('../util/log');
const routes = require('../local/routes');
const util = require('../util/util');
const distribution = require('@brown-ds/distribution');

/*
    The start function will be called to start your node. It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/

const start = function(callback) {
  const server = http.createServer((req, res) => {
    // Listen only for PUT requests
    if (req.method == "PUT") {
      
      // The path determines the service to be used. The URL will have the form
      // http://node_ip:node_port/service/method
      const parsedUrl = url.parse(req.url, true);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean); 
      const service = pathSegments[0];
      const method = pathSegments[1];

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
        let jsonData = null;
        try {
            jsonData = distribution.util.deserialize(body);
        } catch (error) {
            res.statusCode = 400; 
            res.end('Invalid JSON format');
            return;
        }
    
        // Retrieve the service map and call the appropriate function
        routes.get(service, (error, serviceMap) => {
            if (error) {
                console.log(`Error: ${error.message}`);
                res.statusCode = 404;
                res.end('Service not found');
                return;
            }
            if (serviceMap && serviceMap[method]) {
              let functionToCall = serviceMap[method];
          
              functionToCall(jsonData, (error, value) => {
                  if (error) {
                      res.statusCode = 500;
                      res.end(JSON.stringify({ error: error.message }));
                  } else {
                      res.end(JSON.stringify(value));
                  }
              });
          } else {
              console.log(`No function found for service: ${service}, method: ${method}`);
              res.statusCode = 404;
              res.end('Service or method not found');
          }
        });
    });
    } else {
      res.statusCode = 405;
      res.setHeader('Allow', 'PUT');
      res.end('Only PUT requests are allowed');
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