const http = require('http');
const url = require('url');
const log = require('../util/log');
const routes = require('../local/routes');
// const routes = require('../all/routes');


/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    if (req.method == "PUT") {

      /*
        The path of the http request will determine the service to be used.
        The url will have the form: http://node_ip:node_port/service/method
      */

      const parsedUrl = url.parse(req.url, true);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean); 
      const service = pathSegments[0];
      const method = pathSegments[1];
      const nodeIP = parsedUrl.hostname;
      const nodePort = parsedUrl.port;
    
    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */
      let body = "";
      let jsonData = null;
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        try {
          jsonData = JSON.parse(body);
        } catch (error) {
          console.log("Error occurred when parsing the JSON: ", error)
        }
      });

      /* Here, you can handle the service requests. */
      let node = {"ip": nodeIP, "port": nodePort};
      const remote = {"node": node, "service": serviceName, "method": methodName};
      const serviceName = service;
      const methodName = method;

      /* Pass the payload to routes */
      if (methodName == 'put') {
        routes.put(jsonData, serviceName, callback);
      } else if (methodName == 'get') {
        routes.get(serviceName, callback);
      } else if (methodName == 'rem') {
        routes.rem(serviceName, callback);
      }
    }
  });

  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    // server.close();
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
