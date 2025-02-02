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

### Key Challenges
The key challenges of this implementation included searching for the correct functions to be used to serialize and deserialize each data type and maintaining consistency between each of the serialized and deserialized values when testing.

> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.

My implementation comprises `<number>` software components, totaling `<number>` lines of code. Key challenges included `<1, 2, 3 + how you solved them>`.


### Correctness & Performance Characterization

#### Correctness
I wrote `16` tests; these tests take `0.304 seconds` to execute. This includes objects with base types like numbers, booleans, strings, undefined and null. Additionally, I tested on a variety of more complex types like arrays and objects. For these types, I tested arrays with varying data types, nested arrays, deeply-nested objects with varying key and value types, etc. These tests are located in the `m1.student.test.js` file in the `/test` directory.

#### Performance
The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. To sum up, I created a file that tests the average latency of the 3 different workloads of this milestone. This test file is called `m1.latency.test.js`. It is located at `test/test-student`. Note that this latency test file uses the term "operation". For the purposes of this test, an operation consists of executing both the serialize and deserialize functions on a workload/data type.

> ...
