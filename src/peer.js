const Peer = ({ ipfs, peers }) => {
  const api = {
    async get () {
      const { id } = await ipfs.id()
      const peerInfo = await peers.get(id)
      return peerInfo || { id }
    },

    async set (details) {
      const { id } = await ipfs.id()
      await peers.set(id, details)
    }
  }

  return api
}

module.exports = Peer
