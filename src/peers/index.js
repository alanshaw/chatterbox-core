const Syndicate = require('../lib/syndicate')
const GetPeerInfo = require('./get-peer-info')
const SetPeerInfo = require('./set-peer-info')
const GetPeersFeed = require('./get-peers-feed')

const Peers = ({ ipfs, mutexManager, config }) => {
  const getPeerInfoPath = peerId => `${config.peersPath}/${peerId}/info.json`

  const syndicate = Syndicate()

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })
  const setPeerInfo = SetPeerInfo({ ipfs, getPeerInfoPath, getPeerInfo, syndicate })
  const getPeersFeed = GetPeersFeed({
    ipfs,
    peersPath: config.peersPath,
    getPeerInfo: Peers.withPeerMutex(mutexManager, getPeerInfo, 'readLock'),
    syndicate
  })

  return {
    get: Peers.withPeerMutex(mutexManager, getPeerInfo, 'readLock'),
    set: Peers.withPeerMutex(mutexManager, setPeerInfo, 'writeLock'),
    feed: getPeersFeed,
    // Allow these API calls to be made when a writeLock has already been
    // acquired for the peer.
    __unsafe__: {
      get: getPeerInfo,
      set: setPeerInfo
    }
  }
}

Peers.withPeerMutex = (manager, fn, type) => {
  return async (...args) => {
    const mutex = manager.getMutex(`/chatterbox/peers/${args[0]}`)
    const release = await mutex[type]()
    try {
      const res = await fn(...args)
      return res
    } finally {
      release()
    }
  }
}

module.exports = Peers
