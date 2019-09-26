import test from 'ava'
import hat from 'hat'
import defer from 'p-defer'
import AddFriend from '../../../src/friends/add-friend'

test('should validate a passed peer ID', async t => {
  const getFriendsList = () => []
  const setFriendsList = () => {}
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const addFriend = AddFriend({ getFriendsList, setFriendsList, peers, syndicate })

  const err = await t.throwsAsync(addFriend(null))

  t.is(err.message, 'invalid peer ID')
})

test('should add a new peer to the friends list', async t => {
  let friends = []

  const getFriendsList = () => friends
  const setFriendsList = f => { friends = f }
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const addFriend = AddFriend({ getFriendsList, setFriendsList, peers, syndicate })

  const peerId = hat()
  await addFriend(peerId)

  t.deepEqual(friends, [peerId])
})

test('should not add a new peer if already exists', async t => {
  const peerId = hat()
  let friends = [peerId]

  const getFriendsList = () => friends
  const setFriendsList = f => { friends = f }
  const peers = { set: () => {} }
  const syndicate = { publish: () => {} }

  const addFriend = AddFriend({ getFriendsList, setFriendsList, peers, syndicate })

  await addFriend(peerId)

  t.deepEqual(friends, [peerId])
})

test('should publish added peer to syndicate', async t => {
  const deferred = defer()

  const getFriendsList = () => []
  const setFriendsList = () => {}
  const peers = { set: () => {} }
  const syndicate = { publish: diff => deferred.resolve(diff) }

  const addFriend = AddFriend({ getFriendsList, setFriendsList, peers, syndicate })

  const peerId = hat()
  await addFriend(peerId)

  const diff = await deferred.promise

  t.is(diff.action, 'add')
  t.is(diff.id, peerId)
})
