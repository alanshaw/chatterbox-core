const { Buffer } = require('buffer')
const Syndicate = require('../lib/syndicate')

const Friends = ({ ipfs, mutexManager, peers, config }) => {
  const friendsPath = `${config.repoDir}/friends.json`

  const getFriendsList = async () => {
    try {
      const data = await ipfs.files.read(friendsPath)
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }

  const setFriendsList = friends => {
    const data = Buffer.from(JSON.stringify(friends))
    return ipfs.files.write(friendsPath, data, {
      create: true,
      parents: true
    })
  }

  const syndicate = Syndicate()

  const add = require('./add')({ peers, getFriendsList, setFriendsList, syndicate })
  const remove = require('./remove')({ getFriendsList, setFriendsList, syndicate })
  const feed = require('./feed')({
    getFriendsList: Friends.withFriendsMutex(mutexManager, getFriendsList, 'readLock'),
    syndicate
  })

  return {
    add: Friends.withFriendsMutex(mutexManager, add, 'writeLock'),
    remove: Friends.withFriendsMutex(mutexManager, remove, 'writeLock'),
    list: Friends.withFriendsMutex(mutexManager, getFriendsList, 'readLock'),
    feed
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
