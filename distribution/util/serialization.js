const { parsed } = require("yargs");
const crypto = require('crypto');
const { fstat } = require("fs");

// Used for serializing and deserializing circular objects
let deserializeMap = new Map();
let serializeMap = new Map();

// Used for serializing and deserializing native objects
const nativeObjects = new Set(require("repl")._builtinLibs);
nativeObjects.add("global");

function getNativeFunctionPath(fn) {
  for (const moduleName of nativeObjects) {
      try {
          const mod = require(moduleName);
          for (const key in mod) {
              if (mod[key] === fn) {
                  return `${moduleName}.${key}`;
              }
          }
      } catch (err) {
          continue; 
      }
  }
  return null;
}

function serialize(object) {
  // Support serialization for base types
  if (typeof object === "number") {
    return `{"type": "Number", "value": "${object.toString()}"}`;
  } 
  if (typeof object === "boolean") {
    return `{"type": "Boolean", "value": "${object.toString()}"}`;
  }
  if (typeof object === "string") {
    return JSON.stringify({ type: "String", value: object });
  }
  if (object === null) {
    return `{"type": "Null", "value": "${String(object)}"}`;
  }
  if (typeof object === "undefined") {
    return `{"type": "Undefined", "value": "${String(object)}"}`;
  }

  // Add support for Function types
  if (typeof object === "function") {
    const nativePath = getNativeFunctionPath(object);
    if (nativePath) {
      return `{"type": "Native", "value": "${nativePath}"}`;
    } else {
      const functionString = object.toString();
      return `{"type": "Function", "value": "${functionString}"}`;
    }
  } 
  // Serialize Date, Error, and array
  if (object instanceof Date) {
    return `{"type": "Date", "value": "${object.toISOString()}"}`;
  }
  if (object instanceof Error) {
    return `{"type": "Error", "value": "${object.message}"}`;
  }
  if (Array.isArray(object)) {
    let arrPayload = object.map(elem => serialize(elem, new Map())).join(", ");
    return `{"type": "Array", "value": [${arrPayload}]}`; 
  }
  // Serialize objects
  if (serializeMap.has(object)) {
    return `{"type": "Circular", "value": "${serializeMap.get(object)}"}`;
  }
  if (typeof object === "object") {
    const objId = crypto.randomUUID();
    serializeMap.set(object, objId);
    deserializeMap.set(objId, object);

    // Handle normal case
    let objPayload = [];
    for (const key in object) {
      const serializedObj = { key: serialize(key), value: serialize(object[key]) };
      objPayload.push(serializedObj);
    }
    const objString = JSON.stringify({
      type: "Object",
      value: objPayload,
    });
    return objString;
  }
}

function deserialize(string) {
  // Support deserialization for base types
  const obj = JSON.parse(string);
  if (obj.type === "Number") return Number(obj.value);
  if (obj.type === "Boolean") return obj.value === "true";
  if (obj.type === "String") return obj.value;
  if (obj.type === "Null") return null;
  if (obj.type === "Undefined") return undefined;

  // Support deserialization for functions
  if (obj.type === "Function") {
    return new Function(`return ${obj.value}`)();
  }
  if (obj.type === "Native") {
    const parts = obj.value.split(".");
    const moduleName = parts[0];
    const functionName = parts.slice(1).join(".");
    const mod = require(moduleName);
    return mod[functionName];
  }

  // Support deserialization for Error and Date
  if (obj.type === "Date") {
    return new Date(obj.value);
  }
  if (obj.type === "Error") {
    const error = new Error();
    error.message = obj.value;
    return error;
  }
  // Support deserialization for arrays and objects
  if (obj.type === "Array") {
    const des = obj.value.map(elem => deserialize(JSON.stringify(elem)));
    return des;
  }
  if (obj.type === "Circular") {
    return deserializeMap.get(obj.value);
  }
  if (obj.type === "Object") {
    let deserializedObj = {};
    obj.value.forEach(elem => {
      const deserializedKey = deserialize(elem.key); 
      const deserializedVal = deserialize(elem.value); 
      deserializedObj[deserializedKey] = deserializedVal;
      })
    return deserializedObj;
  };
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
