const Syndicate = require('../lib/syndicate')
const GetPeer = require('./get-peer')
const SetPeer = require('./set-peer')
const GetPeersFeed = require('./get-peers-feed')

const Peers = ({ ipfs, mutexManager, config }) => {
  const getPeerPath = peerId => `${config.peersPath}/${peerId}/info.json`

  const syndicate = Syndicate()

  const getPeer = GetPeer({ ipfs, getPeerPath })
  const setPeer = SetPeer({ ipfs, getPeerPath, getPeer, syndicate })
  const getPeersFeed = GetPeersFeed({
    ipfs,
    peersPath: config.peersPath,
    getPeer: Peers.withPeerMutex(mutexManager, getPeer, 'readLock'),
    syndicate
  })

  return {
    get: Peers.withPeerMutex(mutexManager, getPeer, 'readLock'),
    set: Peers.withPeerMutex(mutexManager, setPeer, 'writeLock'),
    feed: getPeersFeed,
    // Allow these API calls to be made when a writeLock has already been
    // acquired for the peer.
    __unsafe__: {
      get: getPeer,
      set: setPeer
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
