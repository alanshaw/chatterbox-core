const { Buffer } = require('buffer')
const mortice = require('mortice')
const Syndicate = require('../lib/syndicate')

module.exports = ({ ipfs, peers, config }) => {
  const getFriendsPath = () => `${config.repoDir}/friends.json`
  const mutex = mortice(getFriendsPath())
  const getMutex = () => mutex

  const getFriendsPeerIds = () => {
    try {
      return ipfs.files.read(getFriendsPath())
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return []
      }
      throw err
    }
  }

  const setFriendsPeerIds = friends => {
    const data = Buffer.from(JSON.stringify(friends))
    return ipfs.files.write(getFriendsPath(), data, {
      create: true,
      parents: true
    })
  }

  const syndicate = Syndicate()


  const add = require('./add')({ peers, getMutex, getFriendsPeerIds, setFriendsPeerIds, syndicate })
  const remove = require('./remove')({ getMutex, getFriendsPeerIds, setFriendsPeerIds, syndicate })
  const list = require('./list')({ peers, getMutex, getFriendsPeerIds })
  const feed = require('./feed')({ peers, getMutex, syndicate })

  return { add, remove, list }
}
