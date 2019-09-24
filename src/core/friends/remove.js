const Validate = require('./validate')

module.exports = ({ getMutex, getFriendsPeerIds, setFriendsPeerIds, syndicate }) => {
  return async peerId => {
    Validate.peerId(peerId)

    const mutex = getMutex()
    const release = await mutex.writeLock()

    try {
      let friends = await getFriendsPeerIds()

      if (!friends.includes(peerId)) return

      friends = friends.filter(id => id !== peerId)

      await setFriendsPeerIds(friends)

      syndicate.publish({ action: 'remove', id: peerId })
    } finally {
      release()
    }
  }
}
