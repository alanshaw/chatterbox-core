import hat from 'hat'
import * as Validate from './validate'
import { PeersApi } from '../peers'
import Syndicate from '../lib/syndicate'
import { Message } from './Message'
import { MessageDiff } from './MessageDiff'

type Deps = {
  ipfs: Ipfs
  peers: PeersApi,
  syndicate: Syndicate<MessageDiff>,
  getMessagesPath: (peerId: string) => string,
  getMessagesList: (peerId: string) => Promise<Message[]>,
  friendsMessageHistorySize: number
}

export default ({
  ipfs,
  peers,
  syndicate,
  getMessagesPath,
  getMessagesList,
  friendsMessageHistorySize
}: Deps) => {
  return async (peerId: string, text: string) => {
    Validate.peerId(peerId)
    Validate.text(text) // TODO: do we need to restrict text size?

    const messageId = hat()
    const receivedAt = Date.now()
    const message = { id: messageId, text, receivedAt }

    let messages = await getMessagesList(peerId)
    let removedMessages: Message[] = []

    const peerInfo = await peers.__unsafe__.get(peerId)

    if (peerInfo && peerInfo.isFriend) {
      messages = messages.concat(message)
    } else {
      const { id } = await ipfs.id()
      if (peerId === id) {
        messages = messages.concat(message)
      } else {
        removedMessages = messages
        messages = [message]
      }
    }

    if (messages.length > friendsMessageHistorySize) {
      removedMessages = messages.slice(0, messages.length - friendsMessageHistorySize)
      messages = messages.slice(-friendsMessageHistorySize)
    }

    const data = Buffer.from(JSON.stringify(messages))
    await ipfs.files.write(getMessagesPath(peerId), data, {
      create: true,
      parents: true,
      truncate: true
    })

    // Caller _should_ have already taken a write lock on the peer
    await peers.__unsafe__.set(peerId, { lastMessage: message, lastSeenAt: receivedAt })

    syndicate.publish({ action: 'add', peerId, messageId, message })

    removedMessages.forEach(m => {
      syndicate.publish({ action: 'remove', peerId, messageId: m.id })
    })
  }
}
