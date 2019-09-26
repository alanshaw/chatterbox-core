const Syndicate = require('../lib/syndicate')
const AddFriend = require('./add-friend')
const RemoveFriend = require('./remove-friend')
const GetFriendsList = require('./get-friends-list')
const SetFriendsList = require('./set-friends-list')
const GetFriendsFeed = require('./get-friends-feed')

const Friends = ({ ipfs, mutexManager, peers, config }) => {
  const friendsPath = `${config.repoDir}/friends.json`

  const getFriendsList = GetFriendsList({ ipfs, friendsPath })
  const setFriendsList = SetFriendsList({ ipfs, friendsPath })

  const syndicate = Syndicate()

  const addFriend = AddFriend({ peers, getFriendsList, setFriendsList, syndicate })
  const removeFriend = RemoveFriend({ getFriendsList, setFriendsList, syndicate })
  const getFriendsFeed = GetFriendsFeed({
    getFriendsList: Friends.withFriendsMutex(mutexManager, getFriendsList, 'readLock'),
    syndicate
  })

  return {
    add: Friends.withFriendsMutex(mutexManager, addFriend, 'writeLock'),
    remove: Friends.withFriendsMutex(mutexManager, removeFriend, 'writeLock'),
    list: Friends.withFriendsMutex(mutexManager, getFriendsList, 'readLock'),
    feed: getFriendsFeed
  }
}

Friends.withFriendsMutex = (manager, fn, type) => async (...args) => {
  const mutex = manager.getMutex('/chatterbox/friends')
  const release = await mutex[type]()
  try {
    const res = await fn(...args)
    return res
  } finally {
    release()
  }
}

module.exports = Friends
