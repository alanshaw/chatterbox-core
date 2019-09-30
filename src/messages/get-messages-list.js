const Validate = require('./validate')

module.exports = ({ ipfs, getMessagesPath }) => {
  return async peerId => {
    Validate.peerId(peerId)

    try {
      const data = await ipfs.files.read(getMessagesPath(peerId))
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        return []
      }
      throw err
    }
  }
}
