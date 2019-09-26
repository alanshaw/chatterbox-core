const Peers = require('./peers')
const Profile = require('./profile')
const Friends = require('./friends')
const Messages = require('./messages')
const MutexManager = require('./lib/mutex-manager')
const Migrator = require('./migrator')

module.exports = async (ipfs, options) => {
  options = options || {}

  // TODO: setup IPFS to ensure Chatterbox server(s) are in bootstrap
  // TODO: verify pubsub is enabled in IPFS

  const mutexManager = MutexManager()

  const config = {
    repoDir: options.repoDir || '/.chatterbox',
    topics: options.topics || {
      broadcast: '/chatterbox/broadcast/1.0.0',
      beacon: '/chatterbox/beacon/1.0.0'
    },
    friendsMessageHistorySize: options.friendsMessageHistorySize || 1000
  }

  config.peersPath = `${config.repoDir}/peers`

  await Migrator({ ipfs, repoDir: config.repoDir }).toLatest()

  const peers = Peers({ ipfs, mutexManager, config })
  const friends = Friends({ ipfs, mutexManager, peers, config })
  const profile = Profile({ ipfs, mutexManager, peers, config })
  const messages = Messages({ ipfs, mutexManager, peers, friends, config })

  return { peers, friends, profile, messages }
}
