module.exports = ({ ipfs, peers }) => {
  const api = {
    async get () {
      const { id } = await ipfs.id()
      return peers.get(id)
    },

    async set (details) {
      const { id } = await ipfs.id()
      return peers.set(id, details)
    }
  }

  return api
}
