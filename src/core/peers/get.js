const Validate = require('./validate')

module.exports = ({ ipfs, getProfilePath }) => {
  return async peerId => {
    Validate.peerId(peerId)

    try {
      const data = await ipfs.files.read(getProfilePath(peerId))
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return false
      }
      throw err
    }
  }
}
