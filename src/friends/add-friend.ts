import { PeersApi } from '../peers'
import { PeerInfoData } from '../peers/PeerInfoData'

type Deps = {
  peers: PeersApi
}

export default ({ peers }: Deps) => {
  return (peerId: string, details?: PeerInfoData) => (
    peers.set(peerId, { ...(details || {}), isFriend: true })
  )
}
