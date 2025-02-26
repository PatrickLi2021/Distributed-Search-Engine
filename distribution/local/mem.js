
const localStore = new Map();
const { local } = require('@brown-ds/distribution');
const id = require('../util/id');
const log = require('../util/log');
const { serialize } = require('../util/serialization');

/*
* Parameters:
* - state: The JS object that we want to put inside our store
* - configuration: The string key we want to be associated with this object
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function put(state, configuration, callback) {
    if (typeof configuration == "string") {
        configuration = serialize({ gid: "local", key: configuration });
        localStore.set(configuration, state);
    }
    // For null case, hash the state and use that as the key
    if (configuration == null) {
        const hashKey = id.getID(state);
        configuration = serialize({ gid: "local", key: hashKey });
        localStore.set(configuration, state);
    } else {
        localStore.set(serialize(configuration), state);
    }
    callback(null, state);
};

/*
* Parameters:
* - configuration: The string key that we want to get
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function get(configuration, callback) {
    if (typeof configuration !== "string") {
        configuration = serialize(configuration);
    } 
    configuration = serialize({gid: "local", key: configuration});

    if (!localStore.has(configuration)) {
        callback(new Error("Local store did not have object associated with key"), null);
        return;
    }
    const objToGet = localStore.get(configuration);
    callback(null, objToGet);
}

/*
* Parameters:
* - configuration: The string key of the object we want to delete from our map
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function del(configuration, callback) {
    if (typeof configuration === 'string') {
        configuration = {gid: "local", key: configuration};
    }
    configuration = serialize(configuration);
    if (localStore.has(configuration)) {
        const objToDelete = localStore.get(configuration);
        localStore.delete(configuration);
        callback(null, objToDelete);
        return;
    }
    callback(new Error("Object to delete not in map"), null);
};

module.exports = {put, get, del};
