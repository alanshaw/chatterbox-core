const Syndicate = require('../lib/syndicate')

const Peers = ({ ipfs, mutexManager, config }) => {
  const peersPath = `${config.repoDir}/peers`
  const getPeerPath = peerId => `${peersPath}/${peerId}`
  const getProfilePath = peerId => `${getPeerPath(peerId)}/profile.json`

  const peerExists = async peerId => {
    try {
      await ipfs.files.stat(getPeerPath(peerId))
      return true
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return false
      }
      throw err
    }
  }

  const syndicate = Syndicate()

  const get = require('./get')({ ipfs, getProfilePath })
  const set = require('./set')({
    ipfs,
    peerExists,
    getProfilePath,
    getProfile: get,
    syndicate
  })
  const feed = require('./feed')({
    ipfs,
    peersPath,
    getProfile: Peers.withPeerMutex(mutexManager, get, 'readLock'),
    syndicate
  })

  return {
    get: Peers.withPeerMutex(mutexManager, get, 'readLock'),
    set: Peers.withPeerMutex(mutexManager, set, 'writeLock'),
    feed,
    // Allow these API calls to be made when a writeLock has already been
    // acquired for the peer.
    __unsafe__: {
      set
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
