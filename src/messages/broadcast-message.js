const { Buffer } = require('buffer')
const Validate = require('./validate')
const { PROTOCOL_VERSION } = require('./constants')

module.exports = ({ ipfs, addMessage, broadcastTopic }) => {
  return async text => {
    Validate.text(text)
    const { id } = await ipfs.id()
    await addMessage(id, text)
    const data = Buffer.from(JSON.stringify({ version: PROTOCOL_VERSION, text }))
    await ipfs.pubsub.publish(broadcastTopic, data)
  }
}
