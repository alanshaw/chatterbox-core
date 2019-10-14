import { PeersApi } from './peers'

type PeerConfig = {
  ipfs: Ipfs,
  peers: PeersApi
}

type PeerInfo = {
  id: string
}

const Peer = ({ ipfs, peers }: PeerConfig) => {
  const api = {
    async get (): Promise<PeerInfo> {
      const { id } = await ipfs.id()
      const peerInfo = await peers.get(id)
      return peerInfo || { id }
    },

    async set (details: { name?: string, avatar?: string }) {
      const { id } = await ipfs.id()
      await peers.set(id, details)
    }
  }

  return api
}

export default Peer
