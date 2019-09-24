const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({
  ipfs,
  peers,
  getMutex,
  syndicate,
  getMessagesPath,
  getMessagesList,
  messageHistorySize
}) => {
  return async (peerId, messageId, text) => {
    Validate.peerId(peerId)
    Validate.messageId(messageId)
    Validate.text(text)

    const receivedAt = Date.now()
    const mutex = getMutex(peerId)
    const release = await mutex.writeLock()

    try {
      const message = { id: messageId, text, receivedAt }
      const messages = await getMessagesList()

      messages.unshift(message)

      if (messages.length > messageHistorySize) {
        messages.pop()
      }

      const data = Buffer.from(JSON.stringify(messages))
      await ipfs.files.write(getMessagesPath(peerId), data, {
        create: true,
        parents: true
      })

      await peers.set(peerId, { lastMessage: message, lastSeenAt: receivedAt })

      syndicate.publish({ action: 'add', id: peerId, message })
    } finally {
      release()
    }
  }
}
