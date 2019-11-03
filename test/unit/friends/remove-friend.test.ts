import test from 'ava'
import { Substitute, Arg } from '@fluffy-spoon/substitute'
import { fakePeerId } from '../../_helpers'
import RemoveFriend from '../../../src/friends/remove-friend'
import { PeersApi } from '../../../src/peers'
import { PeerInfoData } from '../../../src/peers/PeerInfoData'

test('should remove a friend', async t => {
  const peerId = fakePeerId()
  const peerInfos: { [peerId: string]: PeerInfoData } = {
    [peerId]: {
      isFriend: true
    }
  }

  const peers = Substitute.for<PeersApi>()

  peers.set(peerId, Arg.any()).mimicks(async (peerId: string, details: PeerInfoData) => {
    peerInfos[peerId] = details
  })

  peers.get(peerId).mimicks(async peerId => ({
    id: peerId,
    isFriend: false,
    ...peerInfos[peerId]
  }))

  const removeFriend = RemoveFriend({ peers })

  await removeFriend(peerId)

  t.false(peerInfos[peerId].isFriend)
})

test('should not error if peer is already not a friend', async t => {
  const peerId = fakePeerId()
  const peerInfos: { [peerId: string]: PeerInfoData } = {
    [peerId]: {
      isFriend: false
    }
  }

  const peers = Substitute.for<PeersApi>()

  peers.set(peerId, Arg.any()).mimicks(async (peerId: string, details: PeerInfoData) => {
    peerInfos[peerId] = details
  })

  peers.get(peerId).mimicks(async peerId => ({
    id: peerId,
    isFriend: false,
    ...peerInfos[peerId]
  }))

  const removeFriend = RemoveFriend({ peers })

  await removeFriend(peerId)

  t.false(peerInfos[peerId].isFriend)
})
