module.exports = async (ipfs, options) => {
  options = options || {}

  // TODO: setup IPFS to ensure Chatterbox server(s) are in bootstrap
  // TODO: verify pubsub is enabled in IPFS

  const config = { repoDir: '/.chatterbox' }

  const peers = require('./peers')({ ipfs, config })
  const profile = require('./profile')({ ipfs, peers, config })
  const friends = require('./friends')({ ipfs, peers, config })

  return { peers, profile, friends }
}
