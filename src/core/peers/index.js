const mortice = require('mortice')

module.exports = ({ ipfs, config }) => {
  const getPeersPath = () => `${config.repoDir}/peers`
  const getPeerPath = peerId => `${getPeersPath()}/${peerId}`
  const getProfilePath = peerId => `${getPeerPath(peerId)}/profile.json`

  const getMutex = (() => {
    const lockers = {}
    return peerId => {
      lockers[peerId] = lockers[peerId] || mortice(getPeerPath(peerId))
      return lockers[peerId]
    }
  })()

  const peerExists = async peerId => {
    try {
      await ipfs.files.stat(getPeerPath(peerId))
      return true
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        return false
      }
      throw err
    }
  }

  let feeds = []

  const addFeed = source => feeds.push(source)
  const removeFeed = source => { feeds = feeds.filter(s => s !== source) }
  const pushToFeeds = diff => feeds.forEach(feed => feed.push(diff))

  const commonOptions = { ipfs, getMutex, peerExists, getProfilePath }

  const get = require('./get')({ ...commonOptions })
  const set = require('./set')({ ...commonOptions, pushToFeeds, getProfile: get })
  const feed = require('./feed')({ ...commonOptions, getPeersPath, getProfile: get, addFeed, removeFeed })

  return { get, set, feed }
}
