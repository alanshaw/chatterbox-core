const mortice = require('mortice')
const Syndicate = require('../lib/feed-manager')

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

  const syndicate = Syndicate()
  const getProfile = require('./get')({ ipfs, getProfilePath })

  return {
    get: getProfile,
    set: require('./set')({
      ipfs,
      getMutex,
      peerExists,
      syndicate,
      getProfilePath,
      getProfile
    }),
    feed: require('./feed')({
      ipfs,
      getPeersPath,
      getProfile,
      syndicate
    })
  }
}
