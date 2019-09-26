import test from 'ava'
import hat from 'hat'
import GetFriendsList from '../../../src/friends/get-friends-list'

test('should retrieve and parse data from correct path', async t => {
  const friendsPath = `/${Date.now()}/friends.json`
  const friendsList = [hat(), hat(), hat()]

  const ipfs = {
    files: {
      read: path => {
        t.is(path, friendsPath)
        return Buffer.from(JSON.stringify(friendsList))
      }
    }
  }

  const getFriendsList = GetFriendsList({ ipfs, friendsPath })

  const list = await getFriendsList()

  t.deepEqual(list, friendsList)
})

test('should return empty array when friends file does not exist', async t => {
  const friendsPath = `/${Date.now()}/friends.json`

  const ipfs = {
    files: {
      read: path => {
        throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      }
    }
  }

  const getFriendsList = GetFriendsList({ ipfs, friendsPath })

  const list = await getFriendsList()

  t.deepEqual(list, [])
})

test('should throw on read error', async t => {
  const friendsPath = `/${Date.now()}/friends.json`

  const ipfs = {
    files: {
      read: path => {
        throw new Error('boom')
      }
    }
  }

  const getFriendsList = GetFriendsList({ ipfs, friendsPath })

  const err = await t.throwsAsync(getFriendsList())

  t.is(err.message, 'boom')
})
