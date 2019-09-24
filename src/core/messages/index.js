const mortice = require('mortice')
const log = require('debug')('chatterbox:messages')
const Syndicate = require('../lib/syndicate')

module.exports = ({ ipfs, peers, config }) => {
  const getPeersPath = () => `${config.repoDir}/peers`
  const getPeerPath = peerId => `${getPeersPath()}/${peerId}`
  const getMessagesPath = peerId => `${getPeerPath(peerId)}/messages.json`

  const getMutex = (() => {
    const lockers = {}
    return peerId => {
      lockers[peerId] = lockers[peerId] || mortice(getMessagesPath(peerId))
      return lockers[peerId]
    }
  })()

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

  const addMessage = require('./add')({
    ipfs,
    peers,
    syndicate,
    getMutex,
    getMessagesPath,
    getMessagesList,
    messageHistorySize: config.messageHistorySize
  })

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
      return log('failed to add message %s from %s', id, peerId, chatMsg.text, err)
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
    list: getMessagesList
  }
}
