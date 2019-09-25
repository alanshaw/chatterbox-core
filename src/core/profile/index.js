const Profile = ({ ipfs, mutexManager, peers }) => {
  const api = {
    async get () {
      const { id } = await ipfs.id()
      const mutex = mutexManager.getMutex(`/chatterbox/peers/${id}`)
      const release = await mutex.readLock()
      try {
        const profile = await peers.get(id)
        return profile
      } finally {
        release()
      }
    },

    async set (details) {
      const { id } = await ipfs.id()
      const mutex = mutexManager.getMutex(`/chatterbox/peers/${id}`)
      const release = await mutex.readLock()
      try {
        await peers.set(id, details)
      } finally {
        release()
      }
    }
  }

  return api
}

module.exports = Profile
