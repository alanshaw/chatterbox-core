import Peers from './peers'
import Peer from './peer'
import Friends from './friends'
import Messages from './messages'
import MutexManager from './lib/mutex-manager'
import Migrator from './migrator'
import Beacon from './beacon'

type ChatterboxOptions = {
  repoDir?: string,
  topics?: {
    broadcast?: string,
    beacon?: string
  },
  friendsMessageHistorySize?: number,
  beaconInterval?: number
}

export default async (ipfs: Ipfs, options?: ChatterboxOptions) => {
  options = options || {}

  // TODO: setup IPFS to ensure Chatterbox server(s) are in bootstrap
  // TODO: verify pubsub is enabled in IPFS

  const mutexManager = MutexManager()

  const repoDir = options.repoDir || '/.chatterbox'
  const config: ChatterboxConfig = {
    repoDir,
    topics: {
      broadcast: '/chatterbox/broadcast',
      beacon: '/chatterbox/beacon',
      ...options.topics || {}
    },
    friendsMessageHistorySize: options.friendsMessageHistorySize || 1000,
    beaconInterval: options.beaconInterval || 5 * 60 * 1000,
    peersPath: `${repoDir}/peers`
  }

  await Migrator({ ipfs, repoDir: config.repoDir }).toLatest()

  const peers = await Peers({ ipfs, mutexManager, config })
  const friends = await Friends({ ipfs, mutexManager, peers, config })
  const peer = await Peer({ ipfs, mutexManager, peers, config })
  const messages = await Messages({ ipfs, mutexManager, peers, config })
  const beacon = await Beacon({ ipfs, peers, peer, config })

  const api = { peers, friends, peer, messages }

  return {
    ...api,
    destroy: () => Promise.all(
      [...Object.values(api), beacon].map(o => o._destroy && o._destroy())
    )
  }
}
