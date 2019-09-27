const Validate = require('./validate')

module.exports = ({ ipfs, getMessagesList, getMessagesPath, syndicate }) => {
  return async (peerId, messageId) => {
    Validate.peerId(peerId)
    Validate.messageId(messageId)

    const messages = await getMessagesList(peerId)
    const message = messages.find(m => m.id === messageId)

    if (!message) return

    message.readAt = Date.now()

    const data = Buffer.from(JSON.stringify(messages))
    await ipfs.files.write(getMessagesPath(peerId), data)

    syndicate.publish({ action: 'change', peerId, messageId, message })
  }
}
