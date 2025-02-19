/** @typedef {import("../types").Callback} Callback */

const distribution = require("@brown-ds/distribution");


let serviceMap = new Map();
serviceMap.set('status', {});
serviceMap.set('routes', {});
serviceMap.set('comm', {});
serviceMap.set('rpc', global.moreStatus.toLocal);

/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) { 
    // Data parsing
    if (Array.isArray(configuration)) {
        configuration = configuration[0];
    }
    const gid = configuration.gid || "local";
    const service = configuration.service || configuration;

    // Local service
    if (serviceMap.has(service) && gid === "local") {
        return callback(null, serviceMap.get(service));
    
    // Distributed service
    } else if (gid != "local" && distribution[gid] && distribution[gid][service]) {
        return callback(null, distribution[gid][service]);
    } else {
        // Handling RPC calls
        if (global.moreStatus.toLocal.has(service)) {
            const localFuncPtr = global.moreStatus.toLocal.get(service);
            return callback(null, localFuncPtr);
        }
        return callback(new Error("Service not in map"), null);
    }
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
