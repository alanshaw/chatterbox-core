import Syndicate from "../lib/syndicate"
import { PeerInfo } from "./PeerInfo"
import { MutexManager } from "../lib/mutex-manager"
import withPeerMutex from './with-peer-mutex'
import { PeerInfoDiff } from "./PeerInfoDiff"

const OneHour = 1000 * 60 * 60

type Deps = {
  ipfs: Ipfs,
  mutexManager: MutexManager,
  peersPath: string,
  getPeerPath: (peerId: string) => string,
  getPeerInfo: (peerId: string) => Promise<PeerInfo | null>,
  syndicate: Syndicate<PeerInfoDiff>
}

export default ({ ipfs, mutexManager, peersPath, getPeerPath, getPeerInfo, syndicate }: Deps) => {
  return async (options: { filter: (peerInfo: PeerInfo) => boolean }) => {
    options = options || {}

    const since = Date.now() - OneHour
    let filter = options.filter

    if (!filter) {
      const { id } = await ipfs.id()

      filter = peerInfo => {
        if (peerInfo.isFriend) return true
        if (peerInfo.id === id) return true
        if (!peerInfo.lastSeenAt) return false
        return peerInfo.lastSeenAt >= since
      }
    }

    let files: { name: string }[]
    try {
      files = await ipfs.files.ls(peersPath)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        files = []
      } else {
        throw err
      }
    }

    const maybeCollect = withPeerMutex(mutexManager, async peerId => {
      const peerInfo = await getPeerInfo(peerId)

      if (peerInfo && !filter(peerInfo)) {
        await ipfs.files.rm(getPeerPath(peerId), { recursive: true })
        syndicate.publish({ action: 'remove', peerId })
      }
    }, 'writeLock')

    for (const { name } of files) {
      await maybeCollect(name)
    }
  }
}
