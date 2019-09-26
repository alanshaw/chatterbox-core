const Profile = ({ ipfs, peers }) => {
  const api = {
    async get () {
      const { id } = await ipfs.id()
      return peers.get(id)
    },

    async set (details) {
      const { id } = await ipfs.id()
      await peers.set(id, details)
    }
  }

  return api
}

module.exports = Profile
