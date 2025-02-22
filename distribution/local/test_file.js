function () {
    () => {
        console.log('Node is started!');
    };

function anonymous(...args) {

const callback = args.pop();

let remote = {node: {"ip":"127.0.0.1","port":1234}, service: 'ab4a0732f29026c79becde9d8992f3e05d4680a216fb6ee2a74eac8ca15bdbcb', method: 'call'};
let message = args;

distribution.local.comm.send(message, remote, (error, response) => {
  if (error) {
    callback(error);
  } else {
    callback(null, response);
  }
});

};
};