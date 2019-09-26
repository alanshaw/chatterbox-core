module.exports = ({ ipfs, friendsPath }) => {
  return async () => {
    try {
      const data = await ipfs.files.read(friendsPath)
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }
}
