
const localStore = new Map();
const crypto = require('crypto');
const id = require('../util/id');

/*
* Parameters:
* - state: The JS object that we want to put inside our store
* - configuration: The string key we want to be associated with this object
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function put(state, configuration, callback) {
    if (configuration === null) {
        const hashKey = id.getID(state);
        localStore.set(hashKey, state);
    } else {
        localStore.set(configuration, state);
    }
    callback(null, state);
};

/*
* Parameters:
* - configuration: The string key that we want to get
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function get(configuration, callback) {
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
    if (localStore.has(configuration)) {
        const objToDelete = localStore.get(configuration);
        localStore.delete(configuration);
        callback(null, objToDelete);
        return;
    }
    callback(new Error("Object to delete not in map"), null);
};

module.exports = {put, get, del};
