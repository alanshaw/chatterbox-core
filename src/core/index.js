module.exports = async (ipfs, options) => {
  options = options || {}

  // TODO: setup IPFS to ensure Chatterbox server(s) are in bootstrap
  // TODO: verify pubsub is enabled in IPFS

  const config = {
    repoDir: '/.chatterbox',
    topics: {
      broadcast: '/chatterbox/broadcast/1.0.0',
      beacon: '/chatterbox/beacon/1.0.0'
    },
    messageHistorySize: 1000
  }

  const peers = require('./peers')({ ipfs, config })
  const friends = require('./friends')({ ipfs, peers, config })

  return {
    peers,
    profile: require('./profile')({ ipfs, peers, config }),
    friends,
    messages: require('./messages')({ ipfs, peers, friends, config })
  }
}
