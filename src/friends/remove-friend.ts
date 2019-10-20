import { PeersApi } from "../peers"

type Deps = {
  peers: PeersApi
}

export default ({ peers }: Deps) => {
  return (peerId: string) => peers.set(peerId, { isFriend: false })
}
