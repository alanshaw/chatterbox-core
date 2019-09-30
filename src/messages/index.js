const log = require('debug')('chatterbox-core:messages')
const Syndicate = require('../lib/syndicate')
const Peers = require('../peers')
const AddMessage = require('./add-message')
const GetMessagesList = require('./get-messages-list')
const SetMessageRead = require('./set-message-read')
const BroadcastMessage = require('./broadcast-message')
const GetMessagesFeed = require('./get-messages-feed')
const { PROTOCOL_VERSION } = require('./constants')

const Messages = async ({ ipfs, mutexManager, peers, config }) => {
  const getPeerPath = peerId => `${config.peersPath}/${peerId}`
  const getMessagesPath = peerId => `${getPeerPath(peerId)}/messages.json`

  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })

  const syndicate = Syndicate()

  const setMessageRead = SetMessageRead({ ipfs, getMessagesList, getMessagesPath, syndicate })
  const addMessage = Peers.withPeerMutex(
    mutexManager,
    AddMessage({
      ipfs,
      peers,
      syndicate,
      getMessagesPath,
      getMessagesList,
      friendsMessageHistorySize: config.friendsMessageHistorySize
    }),
    'writeLock'
  )
  const broadcastMessage = BroadcastMessage({
    ipfs,
    addMessage,
    broadcastTopic: config.topics.broadcast
  })
  const getMessagesFeed = GetMessagesFeed({
    getMessagesList,
    syndicate
  })

  const onBroadcastMessage = async msg => {
    const id = msg.seqno.toString('hex')
    const peerId = msg.from

    const { id: nodeId } = await ipfs.id()
    if (peerId === nodeId) return

    let chatMsg
    try {
      chatMsg = JSON.parse(msg.data)
    } catch (err) {
      return log('failed to parse %s from %s', id, peerId, msg.data, err)
    }

    log('received chat message %s from %s', id, peerId, chatMsg)

    // TODO: support semver?
    if (chatMsg.version !== PROTOCOL_VERSION) {
      return log('incompatible chat message protocol version %s', chatMsg.version)
    }

    try {
      await addMessage(peerId, chatMsg.text)
    } catch (err) {
      return log('failed to add message %s from %s', id, peerId, chatMsg, err)
    }
  }

  const subscribeBroadcast = () => (
    ipfs.pubsub.subscribe(config.topics.broadcast, onBroadcastMessage, {
      onError: (err, fatal) => {
        log('pubsub broadcast subscription error', err)
        if (fatal) {
          setTimeout(async function resub () {
            try {
              await subscribeBroadcast()
            } catch (err) {
              log('failed to resubscribe', err)
              setTimeout(resub, 1000)
            }
          }, 1000)
        }
      }
    })
  )

  await subscribeBroadcast()

  return {
    list: Peers.withPeerMutex(mutexManager, getMessagesList, 'readLock'),
    read: Peers.withPeerMutex(mutexManager, setMessageRead, 'writeLock'),
    broadcast: broadcastMessage,
    feed: getMessagesFeed,
    _destroy () {
      return ipfs.pubsub.unsubscribe(config.topics.broadcast, onBroadcastMessage)
    }
  }
}

module.exports = Messages
