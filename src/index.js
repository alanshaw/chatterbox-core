const IPFS = require('ipfs')
const AbortController = require('abort-controller')

const ChatterboxServers = []

module.exports = async options => {
  options = options || {}
  const ipfs = options.ipfs || await IPFS.create(options.ipfsOptions)
}
