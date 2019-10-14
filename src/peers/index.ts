import Syndicate from '../lib/syndicate'
import { MutexManager } from '../lib/mutex-manager'
import GetPeerInfo from './get-peer-info'
import SetPeerInfo from './set-peer-info'
import GetPeerInfosFeed from './get-peer-infos-feed'
import GarbageCollect from './garbage-collect'
import withPeerMutex from './with-peer-mutex'

type PeersConfig = {
  ipfs: Ipfs,
  mutexManager: MutexManager,
  config: ChatterboxConfig
}

type PeerInfo = {
  id: string,
  name?: string,
  avatar?: string,
  lastSeenAt?: number
  lastMessage?: {
    id: string,
    text: string,
    receivedAt: number,
    readAt?: number
  },
  isFriend: boolean
}

const Peers = ({ ipfs, mutexManager, config }: PeersConfig) => {
  const getPeerPath = (peerId: string) => `${config.peersPath}/${peerId}`
  const getPeerInfoPath = (peerId: string) => `${getPeerPath(peerId)}/info.json`

  const syndicate = Syndicate()

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })
  const setPeerInfo = SetPeerInfo({ ipfs, getPeerInfoPath, getPeerInfo, syndicate })
  const getPeerInfosFeed = GetPeerInfosFeed({
    ipfs,
    peersPath: config.peersPath,
    getPeerInfo: Peers.withPeerMutex<PeerInfo>(mutexManager, getPeerInfo, 'readLock'),
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
    get: Peers.withPeerMutex<PeerInfo>(mutexManager, getPeerInfo, 'readLock'),
    set: (peerId: string, details: PeerDetails) => {
      return Peers.withPeerMutex(
        mutexManager,
        peerId => setPeerInfo(peerId, details),
        'writeLock'
      )(peerId)
    },
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

export type PeersApi = ReturnType<typeof Peers>

export default Peers
