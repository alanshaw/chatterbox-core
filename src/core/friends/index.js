const { Buffer } = require('buffer')
const mortice = require('mortice')

module.exports = ({ ipfs, peers, config }) => {
  const getFriendsPath = () => `${config.repoDir}/friends.json`
  const mutex = mortice(getFriendsPath())
  const getMutex = () => mutex

  const getFriendsList = () => {
    try {
      return ipfs.files.read(getFriendsPath())
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }

  const setFriendsList = friends => {
    const data = Buffer.from(JSON.stringify(friends))
    return ipfs.files.write(getFriendsPath(), data, {
      create: true,
      parents: true
    })
  }

  const add = require('./add')({ peers, getMutex, getFriendsList, setFriendsList })
  const remove = require('./remove')({ getMutex, getFriendsList, setFriendsList })
  const list = require('./list')({ peers, getMutex, getFriendsList })

  return { add, remove, list }
}
