const fs = require('fs');
const {serialize, deserialize } = require('../util/serialization');
const path = require('path');
const mkdirp = require('mkdirp');
const { id } = require('../util/util');

/* Notes/Tips:

- Use absolute paths to make sure they are agnostic to where your code is running from!
  Use the `path` module for that.
*/


function toAlphanumeric(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '');
}

/*
* Parameters:
* - state: The JS object that we want to put inside our store
* - configuration: The string key we want to be associated with this object
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function put(state, configuration, callback) {
  if (configuration == null) {
    configuration = id.getID(state);
  }

  configuration = toAlphanumeric(configuration);

  // If object is not already a string, serialize it
  const originalObj = state;
  if (typeof state !== 'string') {
    state = serialize(state);
  }

  const directory = id.getNID(global.nodeConfig);
  const filename = configuration;
  
  const dirPath = path.join(process.cwd(), directory);

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
  fs.writeFile(filePath, state, 'utf8', (err) => {
    if (err) {
      callback(new Error(`Error writing object to file: ${err.message}`), null);
      return;
    }
    callback(null, originalObj);
  });
}

/*
* Parameters:
* - configuration: The string key that we want to get
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function get(configuration, callback) {
  configuration = toAlphanumeric(configuration);

  // Get the directory based on NID
  const directory = id.getNID(global.nodeConfig);
  const dirPath = path.join(process.cwd(), directory); // NID-based directory
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
  });
}

/*
* Parameters:
* - configuration: The string key of the object we want to delete from our map
* - callback: callback function, provide target object as a value to the corresponding continuation
*/
function del(configuration, callback) {
  configuration = toAlphanumeric(configuration);

  // Get the directory name based on NID
  const directory = id.getNID(global.nodeConfig);
  const dirPath = path.join(process.cwd(), directory); // NID-based directory
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
