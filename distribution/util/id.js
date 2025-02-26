/** @typedef {import("../types.js").Node} Node */

const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
/** @typedef {!string} ID */

/**
 * @param {any} obj
 * @return {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @return {ID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @return {ID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  // Convert NIDs to numerical representation and insert them into a new list
  const nidList = nids.map(nid => ({ nid, num: idToNum(nid) }));
  const kidNum = idToNum(kid);
  nidList.push({nid: kid, num: kidNum});
  const sortedList = nidList.slice().sort((a, b) => a.num - b.num);

  // Pick the NID right after the one corresponding to the KID
  for (let i = 0; i < sortedList.length; i++) {
    if (sortedList[sortedList.length - 1] == {nid: kid, num: idToNum(kid)}) {
      return sortedList[0].nid;
    } else if (sortedList[i].num > kidNum) {
      return sortedList[i].nid;
    }
  }
  return sortedList[0].nid;
}

/*
* Need to map {nid, num} (where num is created by hashing the kid + nid and then converting the result into a
* numerical representation) because we need to link num to nid. We care about the resulting nid at the end
*/

function rendezvousHash(kid, nids) {
  // Create new list by concatenating each NID with the KID
  const scoredNids = nids.map(nid => {
    const combined = kid + nid;
    const hashedVal = getID(combined);
    const num = idToNum(hashedVal);
    return { nid, num }; // Store both for correct retrieval
  });
  const maxEntry = scoredNids.reduce((max, entry) =>
    entry.num > max.num ? entry : max
  );
  return maxEntry.nid;
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
