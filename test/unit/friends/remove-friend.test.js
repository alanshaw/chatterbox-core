import test from 'ava'
import hat from 'hat'
import defer from 'p-defer'
import RemoveFriend from '../../../src/friends/remove-friend'

test('should validate a passed peer ID', async t => {
  const getFriendsList = () => []
  const setFriendsList = () => {}
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const removeFriend = RemoveFriend({ getFriendsList, setFriendsList, peers, syndicate })

  const err = await t.throwsAsync(removeFriend(null))

  t.is(err.message, 'invalid peer ID')
})

test('should remove a peer from the friends list', async t => {
  const peerId = hat()
  let friends = [peerId]

  const getFriendsList = () => friends
  const setFriendsList = f => { friends = f }
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const removeFriend = RemoveFriend({ getFriendsList, setFriendsList, peers, syndicate })

  await removeFriend(peerId)

  t.deepEqual(friends, [])
})

test('should not error if remove a peer not on the list', async t => {
  const peerId = hat()
  let friends = [hat(), hat(), hat()]

  const getFriendsList = () => friends
  const setFriendsList = f => { friends = f }
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const removeFriend = RemoveFriend({ getFriendsList, setFriendsList, peers, syndicate })

  await removeFriend(peerId)

  t.false(friends.includes(peerId))
})

test('should publish removed peer to syndicate', async t => {
  const deferred = defer()
  const peerId = hat()

  const getFriendsList = () => [peerId]
  const setFriendsList = () => {}
  const peers = { set: () => {} }
  const syndicate = { publish: diff => deferred.resolve(diff) }

  const removeFriend = RemoveFriend({ getFriendsList, setFriendsList, peers, syndicate })

  await removeFriend(peerId)

  const diff = await deferred.promise

  t.is(diff.action, 'remove')
  t.is(diff.id, peerId)
})
