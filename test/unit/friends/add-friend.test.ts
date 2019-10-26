import test from 'ava'
import { Substitute, Arg } from '@fluffy-spoon/substitute'
import { fakePeerId } from '../../_helpers'
import AddFriend from '../../../src/friends/add-friend'
import { PeersApi } from '../../../src/peers'
import { PeerInfoData } from '../../../src/peers/PeerInfoData'

test('should add a friend', async t => {
  const peerInfos: { [peerId: string]: PeerInfoData } = {}
  const peerId = fakePeerId()

  const peers = Substitute.for<PeersApi>()

  peers.set(peerId, Arg.any()).mimicks(async (peerId: string, details: PeerInfoData) => {
    peerInfos[peerId] = details
  })

  peers.get(peerId).mimicks(async peerId => ({
    id: peerId,
    isFriend: false,
    ...peerInfos[peerId]
  }))

  const addFriend = AddFriend({ peers })

  await addFriend(peerId)

  t.true(peerInfos[peerId].isFriend)
})
