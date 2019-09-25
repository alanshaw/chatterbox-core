const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({
  ipfs,
  peers,
  friends,
  syndicate,
  getMessagesPath,
  getMessagesList,
  friendsMessageHistorySize
}) => {
  return async (peerId, messageId, text) => {
    Validate.peerId(peerId)
    Validate.messageId(messageId)
    Validate.text(text)

    const receivedAt = Date.now()
    const message = { id: messageId, text, receivedAt }
    let messages = await getMessagesList()
    const friendsList = await friends.list()

    if (friendsList.includes(peerId)) {
      messages = messages.concat(message)

      if (messages.length > friendsMessageHistorySize) {
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

    // Caller _should_ have already taken a write lock on the peer
    await peers.__unsafe__.set(peerId, { lastMessage: message, lastSeenAt: receivedAt })

    syndicate.publish({ action: 'add', id: peerId, message })
  }
}
