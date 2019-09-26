module.exports = ({ ipfs, getPeerPath }) => {
  return async peerId => {
    try {
      await ipfs.files.stat(getPeerPath(peerId))
      return true
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return false
      }
      throw err
    }
  }
}
