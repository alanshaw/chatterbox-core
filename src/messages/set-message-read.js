const Validate = require('./validate')

module.exports = ({ ipfs, peers, getMessagesList, getMessagesPath, syndicate }) => {
  return async (peerId, messageId) => {
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
