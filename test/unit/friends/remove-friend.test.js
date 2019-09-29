import test from 'ava'
import hat from 'hat'
import RemoveFriend from '../../../src/friends/remove-friend'

test('should remove a friend', async t => {
  const peerId = hat()
  const peerInfos = {
    [peerId]: {
      id: peerId,
      isFriend: true
    }
  }

  const peers = {
    get: peerId => peerInfos[peerId],
    set: (peerId, details) => {
      peerInfos[peerId] = details
    }
  }

  const removeFriend = RemoveFriend({ peers })

  await removeFriend(peerId)

  t.false(peerInfos[peerId].isFriend)
})

test('should not error if peer is already not a friend', async t => {
  const peerId = hat()
  const peerInfos = {
    [peerId]: {
      id: peerId,
      isFriend: false
    }
  }

  const peers = {
    get: peerId => peerInfos[peerId],
    set: (peerId, details) => {
      peerInfos[peerId] = details
    }
  }

  const removeFriend = RemoveFriend({ peers })

  await removeFriend(peerId)

  t.false(peerInfos[peerId].isFriend)
})
