const { Buffer } = require('buffer')

module.exports = ({ ipfs, addMessage, broadcastTopic }) => {
  return async text => {
    const { id } = await ipfs.id()
    await addMessage(id, text)
    const data = Buffer.from(JSON.stringify({ text }))
    await ipfs.pubsub.publish(broadcastTopic, data)
  }
}
