const log = require('debug')('chatterbox:messages')
const Syndicate = require('../lib/syndicate')
const Peers = require('../peers')

const Messages = ({ ipfs, mutexManager, peers, friends, config }) => {
  const getPeerPath = peerId => `${config.peersPath}/${peerId}`
  const getMessagesPath = peerId => `${getPeerPath(peerId)}/messages.json`

  const getMessagesList = peerId => {
    try {
      const data = ipfs.files.read(getMessagesPath(peerId))
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }

  const syndicate = Syndicate()

  const read = require('./read')({ ipfs, getMessagesList, getMessagesPath, syndicate })
  const addMessage = Peers.withPeerMutex(
    mutexManager,
    require('./add')({
      ipfs,
      peers,
      friends,
      syndicate,
      getMessagesPath,
      getMessagesList,
      friendsMessageHistorySize: config.friendsMessageHistorySize
    }),
    'writeLock'
  )

  const onBroadcastMessage = async msg => {
    const id = msg.seqno.toString('hex')
    const peerId = msg.from

    let chatMsg
    try {
      chatMsg = JSON.parse(msg.data)
    } catch (err) {
      return log('failed to parse %s from %s', id, peerId, msg.data, err)
    }

    try {
      await addMessage(peerId, id, chatMsg.text)
    } catch (err) {
      return log('failed to add message %s from %s', id, peerId, chatMsg && chatMsg.text, err)
    }
  }

  const subscribeBroadcast = () => {
    ipfs.pubsub.subscribe(config.topics.broadcast, onBroadcastMessage, {
      onError: (err, fatal) => {
        log('pubsub subscription error', err)
        if (fatal) setTimeout(subscribeBroadcast, 1000)
      }
    })
  }

  subscribeBroadcast()

  return {
    list: Peers.withPeerMutex(mutexManager, getMessagesList, 'readLock'),
    read: Peers.withPeerMutex(mutexManager, read, 'writeLock')
  }
}

module.exports = Messages
