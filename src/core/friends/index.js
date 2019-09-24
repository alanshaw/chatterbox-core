const { Buffer } = require('buffer')
const mortice = require('mortice')
const Syndicate = require('../lib/syndicate')

module.exports = ({ ipfs, peers, config }) => {
  const getFriendsPath = () => `${config.repoDir}/friends.json`
  const mutex = mortice(getFriendsPath())
  const getMutex = () => mutex

  const getFriendsList = async () => {
    try {
      const data = await ipfs.files.read(getFriendsPath())
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
    return ipfs.files.write(getFriendsPath(), data, {
      create: true,
      parents: true
    })
  }

  const syndicate = Syndicate()

  const add = require('./add')({ peers, getMutex, getFriendsList, setFriendsList, syndicate })
  const remove = require('./remove')({ getMutex, getFriendsList, setFriendsList, syndicate })
  const feed = require('./feed')({ getFriendsList, syndicate })

  return { add, remove, list: getFriendsList, feed }
}
