import test from 'ava'
import hat from 'hat'
import SetFriendsList from '../../../src/friends/set-friends-list'

test('should write friends list to correct path', async t => {
  const friendsPath = `/${Date.now()}/friends.json`
  const friendsList = [hat(), hat(), hat()]

  const ipfs = {
    files: {
      write: (path, data) => {
        t.is(path, friendsPath)
        t.deepEqual(data, Buffer.from(JSON.stringify(friendsList)))
      }
    }
  }

  const setFriendsList = SetFriendsList({ ipfs, friendsPath })

  await setFriendsList(friendsList)
})
