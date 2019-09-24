const Validate = require('./validate')

module.exports = ({ getMutex, getFriendsList, setFriendsList, syndicate }) => {
  return async peerId => {
    Validate.peerId(peerId)

    const mutex = getMutex()
    const release = await mutex.writeLock()

    try {
      let friends = await getFriendsList()

      if (!friends.includes(peerId)) return

      friends = friends.filter(id => id !== peerId)

      await setFriendsList(friends)

      syndicate.publish({ action: 'remove', id: peerId })
    } finally {
      release()
    }
  }
}
