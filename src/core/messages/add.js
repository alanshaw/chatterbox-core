const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({
  ipfs,
  peers,
  friends,
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
      let messages = await getMessagesList()
      const friendsList = await friends.list()

      if (friendsList.includes(peerId)) {
        messages = messages.concat(message)

        if (messages.length > messageHistorySize) {
          messages = messages.slice(1)
        }
      } else {
        messages = [message]
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
