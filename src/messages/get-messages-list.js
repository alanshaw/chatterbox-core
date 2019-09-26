module.exports = ({ ipfs, getMessagesPath }) => {
  return peerId => {
    try {
      const data = ipfs.files.read(getMessagesPath(peerId))
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }
}
