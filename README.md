# distribution

This is the distribution library. When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

## Installation

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To import the library, be it in a JavaScript file or on the interactive console, run:

```js
let distribution = require("@brown-ds/distribution");
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
let s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
let n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
distribution.local.status.get('sid', console.log); // 8cf1b
```

You can also store and retrieve values from the local memory:

```js
distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // {name: 'nikos'}
distribution.local.mem.get('key', console.log); // {name: 'nikos'}
```

You can also spawn a new node:

```js
let node = { ip: '127.0.0.1', port: 8080 };
distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
distribution.all.status.get('sid', console.log); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
```

You can also send messages to other nodes:

```js
distribution.all.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // 8cf1c
```

# Results and Reflections

## M1: Serialization / Deserialization

### Summary of Implementation and Key Challenges
The main functionality implemented in this milestone is being able to serialize and deserialize messages/data types so that 2 different nodes in our eventual distributed system will be able to communicate with each other in a consistent way. This involved completing the `serialize` and `deserialize` functions within `serialization.js` in the `util` folder. 

#### Serialization
In terms of my overall serialization structure, I tried to model it after the core distribution library. This involved storing the type as metadata in the serialized string.

I started off implementing serialization for the different base types (`number`, `boolean`, `string`, `null`, `undefined`). For numbers and booleans (and later functions), I used the `toString()` method to serialize the value and for `null` and `undefined`.

For the `Error` type, in order to retrieve the error value, I just fetched its `message` field and stored that as the serialized value. For the `Date` type, I used the `toISOString()` method to convert the date object into a string in date time string format.

For `Array`s and `Object`s, I utilize an iterative approach that goes through every element in the array or key-value pair in the object and recursively call serialize on each element/pair.

#### Deserialization
For deserialization in most cases, I use the `JSON.parse()` function to convert the string into a JavaScript value and object from which I can retrieve values from. The overall structure for each of the cases remains mostly the same as the serialization function, just in the opposite direction.

### Lab Portion
The lab portion included providing support for cyclic objects and native functions. For cyclic objects, I utilized a map to encode cycles where each item in the object that has been seen before maps to a previously-allocated ID stored in that map. I use the `crypto` library in JavaScript to generate random, unique IDs. For native objects/functions, I use the library of built-in modules (require(‘repl’)._builtinLibs) in order to keep track of which functions are considered native.

### Key Challenges
The main challenges of this milestone were deeply analyzing the structure of functions and cyclic objects (for the lab portion) and determining which JavaScript or JSON functions should be used.

### Correctness & Performance Characterization

#### Correctness
I wrote `16` tests; these tests take `0.304 seconds` to execute. This includes objects with base types like numbers, booleans, strings, undefined and null. Additionally, I tested on a variety of more complex types like arrays and objects. For these types, I tested arrays with varying data types, nested arrays, deeply-nested objects with varying key and value types, etc. These tests are located in the `m1.student.test.js` file in the `/test` directory. They are essentially testing if the starting object/structure before serialization is the same after the serialized version of this object is deserialized in order to maintain a consistent structure/protocol.

#### Performance
The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. To sum up, I created a file that executes the average latency of the 3 different workloads of this milestone (base structures, functions, and complex/recursive structures/objects). This file is called `m1.latency.js`. It is located at `test/test-student`. When measuring latency, I decided to use the `performance.now()` library in node. The numbers included in the `package.json` file are the latencies per operation, measured in milliseconds. Note that this latency test file uses the term "operation". For the purposes of this test, an operation consists of executing both the serialize and deserialize functions on a workload/data type.

## M2: Actors and Remote Procedure Calls (RPC)

### Summary of Implementation and Key Challenges

This milestone introduced the idea of nodes and having point-to-point communication between different nodes in our distributed system. The main functionality that was implemented was having each node maintain service bindings (namely `status`, `routes`, and `comm`), handle communication with other nodes (via `comm.send` and `node.js`, which implements the node's listening server), and execute incoming requests from other nodes. Each node is identified by an IP address and a port number. 

The implementation consisted of 5 key components: the listening server (`node.js`), message sending function (`comm.js`), the service binding API (`routes`), and the status API (`status.`). 

The request infrastructure was implemented and housed in `comm.js`. This file consisted of 1 main function, `send()`, which serialized the input message, configured options, and ultimately issued an HTTP PUT request and received the corresponding request.

The listening server was implemented as as a remote HTTP server that simply listened for HTTP PUT requests, extracted the service and method from the path, and then read in the data sent in the request payload. From there, the server used the `routes` interface to retrieve the service map and call the appropriate function, sending the result back to the client.

In `status`, the only function that was implemented was `status.get`. This was used for retriving node-related information such as the IP, port, memory usage, NID, SID, and others. This function utilized continuous passing via  a callback to communicate its return status. `routes` was implemented in a similar way in that it used a `serviceMap` defined locally to map between names and service objects, responsible for handling services to be invoked.

The main challenges that I faced during this milestone were understanding the structure and schema of nodes, services, and methods, as well as getting a strong grasp on how each of the disparate components fit together. In order to overcome these challenges, I made sure to get a thorough look at the codebase before and during the actual implementation. I also made sure to look at the tests during implementation to understand the expected behavior of the system.

#### Lab Portion
For the lab portion of this milestone, I added support for RPCs by implementing the `createRPC` function in `wire.js`. In order to do this, I followed the following procedures:
1. Serialize arguments and send them to the node where the function to execute resides.
2. Call the function on that node, passing the deserialized arguments to it upon call.
3. Serialize the return value and send it back to the node issuing the call to g, the function returned by `createRPC`
4. Pass the results to that function's caller.

In order to streamline the function lookup process on the remote node, I made use of a `toLocal` map that stores mappings of remote pointer strings to function pointers.

### Correctness & Performance Characterization

#### Correctness
To characterize the correctness of my implementation, I ran my implementation of the different components to check if my code included basic functionality. From there, I wrote 12 additional unit tests testing various edge cases and more in-depth general functionality. For example, I test for various node properties in `status`, removal of methods using `rem`, combinations of methods using in tandem (i.e. `rem`, `get`), nonexistent services, etc. These tests take a total of 3.234 seconds to execute.

#### Performance
I characterized the performance of comm and RPC by sending 1000 service requests in a tight loop and used the `performance.now()` package in Node.js to do this. Average throughput and latency is recorded in `package.json`.

### Key Feature

> How would you explain the implementation of `createRPC` to someone who has no background in computer science — i.e., with the minimum jargon possible?

To begin, I would say that in most cases in computing, function calls (AKA a particular task) are executed __locally__, in that the execution of that task takes place on the computer itself. However, sometimes a computer (or node) would like to execute a function that is only available on a remote machine (a machine that is not our own). In order to do this, the remote node/machine sends our node something called an RPC stub, which is essentially an instruction for how to execute that function on the other machine. Once we call the function produced by this stub, it will send a request to that remote node, execute the function there, and the result will be returned back to us.

## M3: Node Groups and Gossip Protocols

### Summary of Implementation and Key Challenges

This milestone focuses on implementing fully dynamic groups of nodes in a distributed system, allowing nodes to be added or removed dynamically. At a high level, node groups serve 3 key purposes: (1) making multiple nodes function as a single system, (2) enabling customized services per group, and (3) supporting scalability. At large scales, gossip protocols are used for information dissemination by limiting communication to a subset of nodes on each iteration.

A core challenge in dynamic node groups is tracking node status and ensuring communication across the group. To facilitate this, the onStart property in a node's configuration allows executing a function when a node completes booting, enabling better initialization and coordination. Nodes and groups are referenced using NIDs (Node IDs) and GIDs (Group IDs), with built-in groups like all (all nodes) and local (current node). Services such as `status`, `groups`, `gossip`, `comm`, and `routes` help manage node interactions. Another key challenge was translating the local implementations of various functions like `comm` and `status` to their distributed versions.

To support distributed execution, `local.comm.send()` and `local.routes.get()` are extended to include group identifiers (GIDs), enabling remote procedure calls (RPCs) within groups. Additionally, the status service is enhanced with spawn and stop methods to dynamically launch and terminate nodes. Distributed services apply operations across multiple nodes, requiring mechanisms to aggregate results from all nodes in a group.

#### Lab Portion
The spawn function is responsible for launching a new node with a given configuration while ensuring that an RPC callback is executed when the node successfully starts. To achieve this, it first creates an RPC stub using `createRPC(toAsync(callback))`, serializes it, and injects it into the new node's configuration. Additionally, if an onStart function is provided in the configuration, it is extracted, sanitized to remove control characters, and modified to include the serialized RPC logic. The modified configuration is then passed to a new child process using Node.js’s spawn function, launching `distribution.js` with the appropriate command-line arguments. The newly created node will execute the provided onStart function and integrate with the distributed system upon booting.

The stop function is designed to gracefully shut down the node. It first calls the provided callback with the current node's configuration to signal the shutdown process. It then closes the HTTP server associated with the node using `global.distribution.node.server.close()`. To ensure that all pending operations are completed before termination, it schedules a delayed `exit(0)` call using `setTimeout`, allowing the node to exit cleanly without abruptly terminating ongoing processes. This ensures the node stops in an orderly manner, preventing potential inconsistencies in the distributed system.

### Correctness & Performance Characterization

#### Correctness
I characterized correctness of this implementation by writing 5 unit tests in the  `m3.student.test.js` file to test both the newly added `groups` service as well as various distributed services. These tests verify various aspects of a distributed system, particularly node grouping, status retrieval, and service routing. The first test ensures that a node can successfully join a group and retrieve status information from other nodes in the group. Other tests validate edge cases and error handling when looking an unknown key, the correct execution of a distributed service, and the retrieval of specific status values like counts and heapTotal. 

#### Performance
The throughput of spawn being launched programmatically 8.423 nodes / sec. The latency of launching nodes through spawn programmatically is 95.0583 ms/node launched. The tests that were used to calculate these metrics are located in `m3.latencyPlusThroughput.test.js`.

The throughput of spawn through the terminal is around 125.643 nodes launched per second.
The latency of spawn through the terminal is around 143.422 ms/node launched.

### Characterizing Convergence of the Gossip Protocol
I found a 0.0754 ms difference between using `logn` vs `n` for the gossip protocol. This parameter is used to determine the number of peer nodes every active node sends to on each iteration of the protocol. The 0.0754 millisecond difference between using `log n` versus `n` as the number of peer nodes in the gossip protocol suggests that sending messages to all nodes was slightly faster in this case, likely due to the relatively small size of the network used in the `gossip.all.extra.test.js` file. However, in a larger network, the performance gap would likely widen, with `log n` leading to faster convergence as fewer nodes would need to be contacted, reducing the overall message overhead. As network size scales up, `log n` would become increasingly advantageous for efficient communication.

### Key Feature

> What is the point of having a gossip protocol? Why doesn't a node just send the message to _all_ other nodes in its group?

We use a gossip protocol instead of direct broadcasting to all nodes because it is more scalable and efficient in a distributed system. Broadcasting to all nodes at once can lead to network congestion and this is exacerbated when the system grows. If we use gossip, this can spread information gradually by having each node randomly relay the message to a few peers, which then do the same.

## M4: Distributed Storage

### Summary of Implementation
This milestone focused on implementing a distributed storage system, which at its core is a distributed key-value store centered around consistent hashing and rendezvous hashing to store, retrieve, update, and delete objects. These techniques allow the system to offer optimal reconfiguration overhead when a node is removed from a group or a new node is added to a group. Given an object and a set of nodes in a particular group, the system will be able to pick a node responsible for storing that object.

#### Local `mem` and `store` Services
These services provide node-local storage for objects using a key-value interface, with `mem` offering ephemeral, in-memory storage and `store` providing persistent storage on disk. Both of these services provide 3 primary operations within their API: `get`, `put`, and `del`, allowing users to insert, retrieve, and delete objects based on a primary key. If a key is not explicitly provided when inserting an object, the system generates one using the SHA-256 hash of the serialized object. These services also guarantee idempotency for `get` and `put`, meaning repeated calls with the same arguments produce the same effect as a single call. 

For `local.store`, the `put` function serializes an object and writes it to a file located in a directory derived from the node configuration. It ensures the directory exists before attempting to write the file, and handles any errors that occur during the file creation process. The `get` function retrieves an object by reading its corresponding file, deserializing the contents, and returning the object via a callback. Similarly, the `del` function deletes the file associated with a specific key and returns the object before deletion. 

For `local.mem`, it operates similarly to `store`. The `put` method stores an object in the localStore map. If no configuration key is provided, the method generates a unique key for the object using `id.getID(state)` and stores the object with this generated key. If a configuration key is provided, the object is associated with that key. After storing the object, the original object is passed to the callback. `get` retrieves an object from the `localStore` map using the provided configuration key. If the key exists in the map, the corresponding object is returned via the callback. If the key is not found, an error is passed to the callback. Lastly, `del` deletes an object from the `localStore` map. If the object exists in the map, it is removed and returned through the callback. If the key is not found, an error is passed to the callback.

### Key Challenges
The key challenges during this implementation were encountered during the implementation of the distributed versions of `mem` and `store`. I had difficulty understanding how to incorporate the additional group-related metadata into those services and being able to distinguish internally between identical keys. I also think that figuring out how to configure the local versions of these services to be able to interoperate with the distributed versions was challenging.

#### Lab Portion
For the lab portion, I had to first implement a `null` interface for both `mem.get` and `store.get` that allowed the
system to retrieve all the keys on a particular service instance. This involved adding special case to see if the input to these methods involved a `null` configuration key and then iterating over either a `map` in the case of `mem` or through a particular file hierarchy in the case of `store` to actually obtain those keys.

Next, I implemented the `reconf` functionality for both `mem` and `store`. This `reconf` function is responsible for redistributing objects across nodes when the configuration of a distributed system changes. It first retrieves the current mapping of keys to their old nodes using a hashing function and then determines the new nodes where each key should be placed. If a key's assigned node has changed, it is marked for relocation. The function then iterates over these keys, retrieving their values from the old nodes, deleting them from the old location, and storing them on the new nodes. 

Lastly, I integrated functionality for detecting the need to reconfigure. This was done by modifying the `gossip` protocol that I introduced into the system from M3. The service now establishes a lightweight periodic check, where each node occasionally queries or receives updates from its peers about the current system membership. 

### Correctness & Performance Characterization

#### Correctness
In order to characterize correctness, I introduced 7 new tests into the system to test my `mem` and `store` implementations. These tests specifically test the insertion, retrieval, and deletion of key-value pairs. They ensure that values can be correctly stored, retrieved, and removed while also checking how the system handles error conditions and edge cases. Several key behaviors are tested, including successful deletions, where a deleted key returns its original value, and failed deletions, where attempting to delete a non-existent key correctly results in an error. 

The tests also cover handling of special key values, such as using `null` as a key or an object as a key and makes sure that the system processes them appropriately. Additionally, they check whether previously stored values remain intact when an unrelated key is deleted. Edge cases include deleting a key that was never stored, using a `null` key, and checking if the system allows complex objects as keys instead of just strings.

For the lab portion, I also wrote a test to double check the functionality of my reconfiguration detection mechanism. To implement this test, I created node additions and removals in the system, then verified that the reconfiguration detection mechanism correctly identified the changes and triggered the expected updates.

In total, these tests take 3.4123 seconds to execute.

#### Performance
In order to characterize performance, I deployed my implementation on 3 AWS nodes and measured its latency and throughput during insertion and retrieval operations. To ensure accurate benchmarking, I structured the client’s execution into three distinct stages: first, I generated 1,000 random key-value pairs and stored them in memory to eliminate object creation overhead. Next, I inserted all objects into the key-value store while recording the time it takes to perform all the operations for insertion. Finally, I queried all 1000 objects by their keys, again measuring the system’s retrieval latency using the `performance.now()` functionality of Node.js. From this, I was able to derive a throughput value as well using the number of operations. 

In terms of specific implementation details, I created 3 separate EC2 instances/nodes on AWS. From there, I configured the security group settings to allow inbound TCP traffic on the port 1234. I then ran the `./distribution` process on each instance using the IP of 0.0.0.0 and the port 1234 to boot up each node. In my test file, I used the public IP and port 1234 to configure each node.

The performance metrics are specified in the `package.json` file.

### Key Feature
> Why is the `reconf` method designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all the objects immediately and then pushing them to their corresponding locations?

By determining the keys in advance, the system can avoid redundant lookups and minimize the risk of conflicts that could occur if keys were fetched and relocated in a single step, especially in a distributed environment where a lot of data (including nodes as well) can be moving in and out of the system at any point in time. Additionally, this approach more easily enables batching processing where you can precompute target locations and grouping operations to reduce network operations. 

## M5: Distributed Execution Engine

### Summary of Implementation

### Key Challenges

#### Lab Portion

### Correctness & Performance Characterization

#### Correctness

#### Performance

### Key Feature



> ...
