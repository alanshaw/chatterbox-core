module.exports = ({ peers, getMutex, getFriendsList }) => {
  return async () => {
    const mutex = getMutex()
    const release = await mutex.readLock()

    try {
      const friends = await getFriendsList()
      return Promise.all(friends.map(peerId => peers.get(peerId)))
    } finally {
      release()
    }
  }
}
