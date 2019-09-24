const Validate = require('./validate')

module.exports = ({ getMutex, getFriendsList, setFriendsList }) => {
  return async peerId => {
    Validate.peerId(peerId)

    const mutex = getMutex()
    const release = await mutex.writeLock()

    try {
      let friends = await getFriendsList()

      if (!friends.includes(peerId)) return

      friends = friends.filter(id => id !== peerId)

      await setFriendsList(friends)
    } finally {
      release()
    }
  }
}
