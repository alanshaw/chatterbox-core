const IPFS = require('ipfs')

module.exports = async options => {
  options = options || {}
  const ipfs = options.ipfs || await IPFS.create(options.ipfsOptions)
  const config = { repoDir: '/.chatterbox' }

  const peers = require('./peers')({ ipfs, config })
  const profile = require('./profile')({ ipfs, peers, config })

  return { peers, profile }
}
