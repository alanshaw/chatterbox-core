import { CoreApi } from 'ipfs'
import { PeersApi } from './peers'
import { PeerInfo } from './peers/PeerInfo'

type Deps = {
  ipfs: CoreApi,
  peers: PeersApi
}

const Peer = ({ ipfs, peers }: Deps) => {
  const api = {
    async get (): Promise<PeerInfo> {
      const { id } = await ipfs.id()
      const peerInfo = await peers.get(id)
      return peerInfo || { id, isFriend: false }
    },

    async set (details: { name?: string, avatar?: string }) {
      const { id } = await ipfs.id()
      await peers.set(id, details)
    }
  }

  return api
}

export default Peer

export type PeerApi = ReturnType<typeof Peer>
