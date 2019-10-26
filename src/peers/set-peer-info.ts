import { CoreApi } from 'ipfs'
import * as Validate from './validate'
import Syndicate from '../lib/syndicate'
import { PeerInfo } from './PeerInfo'
import { PeerInfoData } from './PeerInfoData'
import { PeerInfoDiff } from './PeerInfoDiff'

type Deps = {
  ipfs: CoreApi,
  getPeerInfoPath: (peerId: string) => string,
  getPeerInfo: (peerId: string) => Promise<PeerInfo | null>,
  syndicate: Syndicate<PeerInfoDiff>
}

export default ({ ipfs, getPeerInfoPath, getPeerInfo, syndicate }: Deps) => {
  return async (peerId: string, details: PeerInfoData) => {
    Validate.peerId(peerId)

    details = details || {}

    if (details.name != null) {
      Validate.name(details.name)
    }

    if (details.avatar != null) {
      Validate.avatar(details.avatar)
    }

    if (details.lastSeenAt !== undefined) {
      Validate.lastSeenAt(details.lastSeenAt)
    }

    if (details.lastMessage !== undefined) {
      Validate.lastMessage(details.lastMessage)
    }

    if (details.isFriend !== undefined) {
      Validate.isFriend(details.isFriend)
    }

    let peerInfo = await getPeerInfo(peerId)
    let action: 'change' | 'add'

    if (peerInfo) {
      action = 'change'

      if (details.name || details.name === null) {
        peerInfo.name = details.name
      }

      if (details.avatar || details.avatar === null) {
        peerInfo.avatar = details.avatar
      }

      if (details.lastSeenAt) {
        peerInfo.lastSeenAt = details.lastSeenAt
      }

      if (details.lastMessage) {
        peerInfo.lastMessage = details.lastMessage
      }

      if (details.isFriend != null) {
        peerInfo.isFriend = details.isFriend
      }
    } else {
      action = 'add'
      peerInfo = {
        id: peerId,
        name: details.name,
        avatar: details.avatar,
        lastSeenAt: details.lastSeenAt,
        lastMessage: details.lastMessage,
        isFriend: details.isFriend || false
      }
    }

    const data = Buffer.from(JSON.stringify(peerInfo))
    await ipfs.files.write(getPeerInfoPath(peerId), data, {
      create: true,
      parents: true,
      truncate: true
    })

    syndicate.publish({ action, peerId: peerInfo.id, peerInfo })
  }
}
