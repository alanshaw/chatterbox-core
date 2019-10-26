import debug from 'debug'
import { CoreApi, PubSubMessage } from 'ipfs'
import Syndicate from '../lib/syndicate'
import Peers, { PeersApi } from '../peers'
import AddMessage from './add-message'
import GetMessagesList from './get-messages-list'
import SetMessageRead from './set-message-read'
import BroadcastMessage from './broadcast-message'
import GetMessagesFeed from './get-messages-feed'
import { PROTOCOL_VERSION } from './constants'
import { MutexManager } from '../lib/mutex-manager'
import { ChatterboxConfig } from '../ChatterboxConfig'
import { MessageDiff } from './MessageDiff'

const log = debug('chatterbox-core:messages')

type Deps = {
  ipfs: CoreApi
  mutexManager: MutexManager
  peers: PeersApi
  config: ChatterboxConfig
}

type BroadcastMessage = {
  version: string
  text: string
}

const Messages = async ({ ipfs, mutexManager, peers, config }: Deps) => {
  const getPeerPath = (peerId: string) => `${config.peersPath}/${peerId}`
  const getMessagesPath = (peerId: string) => `${getPeerPath(peerId)}/messages.json`

  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })

  const syndicate = new Syndicate<MessageDiff>()

  const setMessageRead = SetMessageRead({
    ipfs, 
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: config.friendsMessageHistorySize
  })
  const addMessage = AddMessage({
    ipfs,
    peers,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize: config.friendsMessageHistorySize
  })
  const broadcastMessage = BroadcastMessage({
    ipfs,
    addMessage: (peerId: string, text: string) => {
      return Peers.withPeerMutex(
        mutexManager,
        peerId => addMessage(peerId, text),
        'writeLock'
      )(peerId)
    },
    broadcastTopic: config.topics.broadcast
  })
  const getMessagesFeed = GetMessagesFeed({
    getMessagesList,
    syndicate
  })

  const onBroadcastMessage = async (msg: PubSubMessage) => {
    const id = msg.seqno.toString('hex')
    const peerId = msg.from

    const { id: nodeId } = await ipfs.id()
    if (peerId === nodeId) return

    let chatMsg: BroadcastMessage
    try {
      chatMsg = JSON.parse(msg.data.toString())
    } catch (err) {
      return log('failed to parse %s from %s', id, peerId, msg.data, err)
    }

    log('received chat message %s from %s', id, peerId, chatMsg)

    // TODO: support semver?
    if (chatMsg.version !== PROTOCOL_VERSION) {
      return log('incompatible chat message protocol version %s', chatMsg.version)
    }

    try {
      await Peers.withPeerMutex(
        mutexManager,
        peerId => addMessage(peerId, chatMsg.text),
        'writeLock'
      )(peerId)
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
    read: (peerId: string, messageId: string) => Peers.withPeerMutex(
      mutexManager,
      (peerId: string) => setMessageRead(peerId, messageId),
      'writeLock'
    ),
    broadcast: broadcastMessage,
    feed: getMessagesFeed,
    _destroy () {
      return ipfs.pubsub.unsubscribe(config.topics.broadcast, onBroadcastMessage)
    }
  }
}

export default Messages
