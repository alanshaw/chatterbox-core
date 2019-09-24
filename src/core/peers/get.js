const Validate = require('./validate')

module.exports = ({ ipfs, getMutex, peerExists, getProfilePath }) => {
  return async peerId => {
    Validate.peerID(peerId)

    const mutex = getMutex(peerId)
    const release = await mutex.readLock()

    try {
      const exists = await peerExists(peerId)
      if (!exists) return null

      const data = await ipfs.files.read(getProfilePath(peerId))
      return JSON.parse(data)
    } finally {
      release()
    }
  }
}
