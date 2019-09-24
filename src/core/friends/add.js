const Validate = require('./validate')

module.exports = ({ peers, getMutex, getFriendsList, setFriendsList }) => {
  return async (peerId, details) => {
    Validate.peerId(peerId)

    const mutex = getMutex()
    const release = await mutex.writeLock()

    try {
      const friends = await getFriendsList()

      await peers.set(peerId, details)

      if (friends.includes(peerId)) return

      friends.push(peerId)

      await setFriendsList(friends)
    } finally {
      release()
    }
  }
}
