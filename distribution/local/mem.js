
const localStore = new Map(); // { {gid: {key: object}, ...}, ...}
const { local } = require('@brown-ds/distribution');
const id = require('../util/id');
const log = require('../util/log');
const { serialize, deserialize } = require('../util/serialization');

/*
* Parameters:
* - state: The JS object that we want to put inside our store
* - configuration: The string key we want to be associated with this object
* - callback: callback function, provide target object as a value to the corresponding continuation
*/

function put(state, configuration, callback) {
    if (configuration == null) {
        const hashKey = id.getID(state);
        const localData = localStore.has("local") ? localStore.get("local") : {};
        localData[hashKey] = state;
        localStore.set("local", localData); 
    } 
    else if (typeof configuration === 'object') {
        // Check if the gid already exists in the store
        const currentData = localStore.has(configuration.gid) ? localStore.get(configuration.gid) : {};
        currentData[configuration.key] = state; // Add the new key-value pair to the existing data
        localStore.set(configuration.gid, currentData); // Update the gid with the merged object
    }
    else if (typeof configuration == "string") {
        if (!localStore.has("local")) {
            localStore.set("local", {}); 
        }
        const localData = localStore.get("local");
        localData[configuration] = state; // Add the new key-value pair
        localStore.set("local", localData);  // Ensure we update the map
    }
    else {
        const currentData = localStore.has(configuration.gid) ? localStore.get(configuration.gid) : {};
        currentData[configuration.key] = state; // Add the new key-value pair to the existing data
        localStore.set(configuration.gid, currentData); // Update the gid with the merged object
    }    
    callback(null, state);
}





/*
* Parameters:
* - configuration: The string key that we want to get
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function get(configuration, callback) {
    if (configuration === null || configuration.key === null) {
        let keys = [];
        for (const [gid, subMap] of localStore) {
            if (typeof subMap === "object") {
                keys.push(...Object.keys(subMap)); 
            }
        }
        callback(null, keys);
        return;
    }
    
    let gid = "";
    let key = "";
    if (typeof configuration === 'object') {
        gid = configuration.gid;
        key = configuration.key;
    } 
    else {
        gid = 'local';
        key = configuration;
    }
    if (!localStore.has(gid)) {
        callback(new Error("Local store did not have object associated with gid"), null);
        return;
    }
    let gidMap = localStore.get(gid);
    if (!gidMap || !(key in gidMap)) {
        callback(new Error("Local store did not have object associated with key"), null);
        return;
    }
    const objToGet = gidMap[key];
    callback(null, objToGet);
}


/*
* Parameters:
* - configuration: The string key of the object we want to delete from our map
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function del(configuration, callback) {
    if (typeof configuration === 'string') {
        configuration = { gid: "local", key: configuration };
    }
    const { gid, key } = configuration;
    if (!localStore.has(gid)) {
        callback(new Error("Object to delete not in map"), null);
        return;
    }
    let gidMap = localStore.get(gid);
    if (!gidMap || !(key in gidMap)) {
        callback(new Error("Object to delete not in map"), null);
        return;
    }
    const objToDelete = gidMap[key];
    delete gidMap[key];

    // If the group becomes empty, remove it from localStore
    if (Object.keys(gidMap).length === 0) {
        localStore.delete(gid);
    }
    callback(null, objToDelete);
}


module.exports = {put, get, del};
