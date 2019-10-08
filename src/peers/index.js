const Syndicate = require('../lib/syndicate')
const GetPeerInfo = require('./get-peer-info')
const SetPeerInfo = require('./set-peer-info')
const GetPeerInfosFeed = require('./get-peer-infos-feed')
const GarbageCollect = require('./garbage-collect')
const withPeerMutex = require('./with-peer-mutex')

const Peers = ({ ipfs, mutexManager, config }) => {
  const getPeerPath = peerId => `${config.peersPath}/${peerId}`
  const getPeerInfoPath = peerId => `${getPeerPath(peerId)}/info.json`

  const syndicate = Syndicate()

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })
  const setPeerInfo = SetPeerInfo({ ipfs, getPeerInfoPath, getPeerInfo, syndicate })
  const getPeerInfosFeed = GetPeerInfosFeed({
    ipfs,
    peersPath: config.peersPath,
    getPeerInfo: Peers.withPeerMutex(mutexManager, getPeerInfo, 'readLock'),
    syndicate
  })
  const garbageCollect = GarbageCollect({
    ipfs,
    mutexManager,
    getPeerInfo,
    peersPath: config.peersPath,
    getPeerPath,
    syndicate
  })

  return {
    get: Peers.withPeerMutex(mutexManager, getPeerInfo, 'readLock'),
    set: Peers.withPeerMutex(mutexManager, setPeerInfo, 'writeLock'),
    feed: getPeerInfosFeed,
    gc: garbageCollect,
    // Allow these API calls to be made when a writeLock has already been
    // acquired for the peer.
    __unsafe__: {
      get: getPeerInfo,
      set: setPeerInfo
    }
  }
}

Peers.withPeerMutex = withPeerMutex

module.exports = Peers
