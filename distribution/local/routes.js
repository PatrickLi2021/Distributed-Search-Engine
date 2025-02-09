/** @typedef {import("../types").Callback} Callback */


let serviceMap = new Map();

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) { // configuration is the same as the service name
    if (serviceMap.has(configuration)) {
        return callback(null, serviceMap.get(configuration));
    } else {
        return callback(new Error("Service not in map"), null);
    }
    return;
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    serviceMap.set(configuration, service);
    if (callback) {
        callback(null, service);
    }
    return;
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    if (serviceMap.has(configuration)) {
        serviceMap.delete(configuration);
        callback(null, configuration);
    } else {
        callback(new Error("Configuration not found in map"));
    }
    return;
};

module.exports = {get, put, rem};
