import test from 'ava'
import { fakePeerId } from '../../_helpers'
import AddFriend from '../../../src/friends/add-friend'

test('should add a friend', async t => {
  const peerInfos = {}

  const peers = {
    get: peerId => peerInfos[peerId],
    set: (peerId, details) => {
      peerInfos[peerId] = details
    }
  }

  const addFriend = AddFriend({ peers })

  const peerId = fakePeerId()
  await addFriend(peerId)

  t.true(peerInfos[peerId].isFriend)
})
