/** @typedef {import("../types").Callback} Callback */


let serviceMap = new Map();
serviceMap.set('status', {});
serviceMap.set('routes', {});
serviceMap.set('comm', {});
serviceMap.set('call', {});


/**
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) { // configuration is the same as the service name
    if (Array.isArray(configuration)) {
        configuration = configuration[0];
    }
    if (serviceMap.has(configuration)) {
        return callback(null, serviceMap.get(configuration));
    } else {
        if (global.moreStatus.toLocal.has(configuration)) {
            const localFuncPtr = global.moreStatus.toLocal.get(configuration);
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
