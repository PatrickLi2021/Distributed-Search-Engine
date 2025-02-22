const gossip = {};


gossip.recv = function(payload, callback) {
    // Initialize a set to keep track of received messages
    if (!global.moreStatus.receivedMessages) {
        global.moreStatus.receivedMessages = new Set();
    }

    // Use payload as the unique identifier
    const messageKey = payload.id; 

    // Ignore message if it has been seen before
    if (global.moreStatus.receivedMessages.has(messageKey)) {
        callback(new Error("Message has been seen before"), null);
        return;
    }

    // Mark this message as received
    global.moreStatus.receivedMessages.add(messageKey);

    // Continue gossiping by forwarding the message to a subset of nodes
    global.distribution.local.gossip.send(payload, remote, (e, v) => {
        callback(e, v);
    })
};

module.exports = gossip;
