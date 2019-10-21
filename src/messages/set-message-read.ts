import * as Validate from './validate'
import { PeersApi } from '../peers'
import Syndicate from '../lib/syndicate'
import { MessageDiff } from './MessageDiff'
import GetMessagesList from './get-messages-list'

type Deps = {
  ipfs: Ipfs
  peers: PeersApi,
  syndicate: Syndicate<MessageDiff>,
  getMessagesPath: (peerId: string) => string,
  getMessagesList: ReturnType<typeof GetMessagesList>,
  friendsMessageHistorySize: number
}

export default ({ ipfs, peers, getMessagesList, getMessagesPath, syndicate }: Deps) => {
  return async (peerId: string, messageId: string) => {
    Validate.peerId(peerId)
    Validate.messageId(messageId)

    const messages = await getMessagesList(peerId)
    const message = messages.find(m => m.id === messageId)

    if (!message || message.readAt) return

    message.readAt = Date.now()

    const data = Buffer.from(JSON.stringify(messages))
    await ipfs.files.write(getMessagesPath(peerId), data, { truncate: true })

    const peer = await peers.__unsafe__.get(peerId)

    if (peer && peer.lastMessage && peer.lastMessage.id === messageId) {
      await peers.__unsafe__.set(peerId, {
        lastMessage: { ...peer.lastMessage, readAt: message.readAt }
      })
    }

    syndicate.publish({ action: 'change', peerId, messageId, message })
  }
}
