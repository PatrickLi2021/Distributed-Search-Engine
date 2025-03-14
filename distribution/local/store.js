const fs = require('fs');
const {serialize, deserialize } = require('../util/serialization');
const path = require('path');
const { id } = require('../util/util');
const glob = require("glob");

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/

var getDirectories = function (dirPath, callback) {
  glob(dirPath + '/**/*', callback);
};


/*
* Parameters:
* - state: The JS object that we want to put inside our store
* - configuration: The string key we want to be associated with this object
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function put(state, configuration, callback) { 
  console.log("IN STORE PUT, state: ", state);
  console.log("IN STORE PUT, configuration: ", configuration); 
  let filename = "";
  let group = "";
  let directory = id.getNID(global.nodeConfig);
  
  // Case when local.put is called directly (no proagation from distributed service)
  if (typeof configuration === "string") {
    filename = configuration;
    node = id.getNID(global.nodeConfig);
  }
  // Other case when local.put is called directly (no proagation from distributed service)
  else if (configuration == null) {
    const hashKey = id.getID(state);
    configuration = hashKey;
    filename = id.getID(state);
  }
  // Distributed Case:
  else if (configuration.key == null) {
    group = configuration.gid;
    const hashKey = id.getID(state);
    configuration = hashKey;
    filename = id.getID(state);
  }
  // Distributed Case
  else if (typeof configuration === "object") {
    group = configuration.gid;
    filename = configuration.key;
  }
  const dirPath = path.join(process.cwd(), group + '/' + directory);
  console.log("In store put, dirPath: ", dirPath);

  // Ensure the directory exists before writing the file
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    callback(new Error("Error creating directory"), null);
    return;
  }

  // Define the file path inside the directory
  const filePath = path.join(dirPath, `${filename}.json`);

  // Write the serialized object to the file
  fs.writeFile(filePath, serialize(state), 'utf8', (err) => {
    if (err) {
      callback(new Error(`Error writing object to file: ${err.message}`), null);
      return;
    }
    callback(null, state);
  });
}

/*
* Parameters:
* - configuration: The string key that we want to get
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function get(configuration, callback) {
  let group = "";
  if (configuration && typeof configuration === 'object') {
    group = configuration.gid || 'local';
    configuration = configuration.key;
  }

  // Get the directory based on NID
  const directory = id.getNID(global.nodeConfig);
  let dirPath = path.join(process.cwd(), group + '/' + directory);

  // Handle null case
  if (configuration === null) {
    dirPath = path.join(process.cwd(), group + '/' + id.getNID(global.nodeConfig));
    getDirectories(dirPath, function (err, res) {
      if (err) {
        callback(null, err);
        return;
      } else {
        res = res.filter(filePath => path.extname(filePath) === '.json').map(filePath => path.basename(filePath, '.json')); 
        callback(null, res);
        return;
      }
    });
    return;
  }
    
  const filePath = path.join(dirPath, `${configuration}.json`);

  // Read the file to retrieve the object
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(new Error(`No data found for key: ${configuration}`), null);
        return;
      } else {
        callback(new Error("Error reading the file"), null);
        return;
      }
    }
    // Deserialize the object
    const deserializedObj = deserialize(data);
    callback(null, deserializedObj);
    return;
  });
}

/*
* Parameters:
* - configuration: The string key of the object we want to delete from our map
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function del(configuration, callback) {
  let group = "";
  if (typeof configuration === 'object') {
    group = configuration.gid;
    configuration = configuration.key;
  }
  
  // Get the directory name based on NID
  const directory = id.getNID(global.nodeConfig);
  const dirPath = path.join(process.cwd(), group + "/" + directory); // NID-based directory
  const filePath = path.join(dirPath, `${configuration}.json`);

  // Read the file to retrieve the stored object before deletion
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        callback(new Error(`No data found for key: ${configuration}`), null);
      } else {
        callback(new Error("Error reading the file"), null);
      }
      return;
    }
    // Deserialize the object before deleting
    const deletedObj = deserialize(data);

    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        callback(new Error("Error deleting the file"), null);
        return;
      }

      // Check if directory is empty and remove it if needed
      fs.readdir(dirPath, (err, files) => {
        if (!err && files.length === 0) {
          fs.rmdir(dirPath, () => {}); // Silently attempt to remove the directory
        }
      });

      // Return the deleted object
      callback(null, deletedObj);
    });
  });
}

module.exports = {put, get, del};
