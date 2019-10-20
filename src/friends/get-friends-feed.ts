import { PeersApi } from "../peers"
import { PeerInfo } from "../peers/PeerInfo"

type Deps = {
  peers: PeersApi
}

type Options = {
  filter?: (peerInfo: PeerInfo) => boolean,
  signal?: AbortSignal
}

export default ({ peers }: Deps) => {
  return (options: Options = {}) => {
    const filter = (peerInfo: PeerInfo) => {
      if (peerInfo.isFriend) {
        return options.filter ? options.filter(peerInfo) : true
      }

      return false
    }

    return peers.feed({ ...options, filter })
  }
}
