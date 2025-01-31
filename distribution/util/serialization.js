
function serialize(object) {
  // Support serialization for base types
  if (typeof object === "number") {
    return `{"type": "Number", "value": "${object.toString()}"}`;
  } 
  if (typeof object === "boolean") {
    return `{"type": "Boolean", "value": "${object.toString()}"}`;
  }
  if (typeof object === "string") {
    return `{"type": "String", "value": "${object.toString()}"}`;
  }
  if (object === null) {
    return `{"type": "Null", "value": "${String(object)}"}`;
  }
  if (typeof object === "undefined") {
    return `{"type": "Undefined", "value": "${String(object)}"}`;
  }

  // Add support for Function types
  if (typeof object === "function") {
    const functionString = object.toString();
    return `{"type": "Function", "value": "${functionString}"}`
  } 
}


function deserialize(string) {
  // Support deserialization for base types
  let obj = JSON.parse(string);
  console.log(obj);
  if (obj.type === "Number") return Number(obj.value);
  if (obj.type === "Boolean") return obj.value === "true";
  if (obj.type === "String") return obj.value;
  if (obj.type === "Null") return null;
  if (obj.type === "Undefined") return undefined;

  // Support deserialization for functions
  if (obj.type === "Function") {
    const match = funcString.match(/\(([^)]*)\)\s*=>\s*(.*)/); // func structure pattern match
    const args = match[1];
    const body = match[2];
    return new Function(args, `return ${body}`)
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
