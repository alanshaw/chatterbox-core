const Validate = require('./validate')

module.exports = ({ peers, getMutex, getFriendsPeerIds, setFriendsPeerIds, syndicate }) => {
  return async (peerId, details) => {
    Validate.peerId(peerId)

    const mutex = getMutex()
    const release = await mutex.writeLock()

    try {
      const friends = await getFriendsPeerIds()

      await peers.set(peerId, details)

      if (friends.includes(peerId)) return

      friends.push(peerId)

      await setFriendsPeerIds(friends)

      syndicate.publish({ action: 'add', id: peerId })
    } finally {
      release()
    }
  }
}
