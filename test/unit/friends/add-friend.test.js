import test from 'ava'
import hat from 'hat'
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

  const peerId = hat()
  await addFriend(peerId)

  t.true(peerInfos[peerId].isFriend)
})
