const Peers = require('./peers')
const Peer = require('./peer')
const Friends = require('./friends')
const Messages = require('./messages')
const MutexManager = require('./lib/mutex-manager')
const Migrator = require('./migrator')
const Beacon = require('./beacon')

module.exports = async (ipfs, options) => {
  options = options || {}

  // TODO: setup IPFS to ensure Chatterbox server(s) are in bootstrap
  // TODO: verify pubsub is enabled in IPFS

  const mutexManager = MutexManager()

  const config = {
    repoDir: options.repoDir || '/.chatterbox',
    topics: options.topics || {
      broadcast: '/chatterbox/broadcast',
      beacon: '/chatterbox/beacon'
    },
    friendsMessageHistorySize: options.friendsMessageHistorySize || 1000,
    beaconInterval: 5 * 60 * 1000
  }

  config.peersPath = `${config.repoDir}/peers`

  await Migrator({ ipfs, repoDir: config.repoDir }).toLatest()

  const peers = await Peers({ ipfs, mutexManager, config })
  const friends = await Friends({ ipfs, mutexManager, peers, config })
  const peer = await Peer({ ipfs, mutexManager, peers, config })
  const messages = await Messages({ ipfs, mutexManager, peers, friends, config })
  const beacon = await Beacon({ ipfs, peers, peer, config })

  const api = { peers, friends, peer, messages }

  return {
    ...api,
    destroy: () => Promise.all(
      [...Object.values(api), beacon].map(o => o._destroy && o._destroy())
    )
  }
}
