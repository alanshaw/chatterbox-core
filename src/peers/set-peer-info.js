const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({ ipfs, getPeerInfoPath, getPeerInfo, syndicate }) => {
  return async (peerId, details) => {
    Validate.peerId(peerId)

    details = details || {}

    if (details.name != null) {
      Validate.name(details.name)
    }

    if (details.avatar != null) {
      Validate.avatar(details.avatar)
    }

    if (details.lastSeenAt !== undefined) {
      Validate.lastSeenAt(details.lastSeenAt)
    }

    if (details.lastMessage !== undefined) {
      Validate.lastMessage(details.lastMessage)
    }

    if (details.isFriend !== undefined) {
      Validate.isFriend(details.isFriend)
    }

    let exists
    try {
      await ipfs.files.stat(getPeerInfoPath(peerId))
      exists = true
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        exists = false
      } else {
        throw err
      }
    }

    let peerInfo, action

    if (exists) {
      action = 'change'
      peerInfo = await getPeerInfo(peerId)

      if (details.name || details.name === null) {
        peerInfo.name = details.name
      }

      if (details.avatar || details.avatar === null) {
        peerInfo.avatar = details.avatar
      }

      if (details.lastSeenAt) {
        peerInfo.lastSeenAt = details.lastSeenAt
      }

      if (details.lastMessage) {
        peerInfo.lastMessage = details.lastMessage
      }

      if (details.isFriend != null) {
        peerInfo.isFriend = details.isFriend
      }
    } else {
      action = 'add'
      peerInfo = {
        id: peerId,
        name: details.name,
        avatar: details.avatar,
        lastSeenAt: details.lastSeenAt,
        lastMessage: details.lastMessage,
        isFriend: details.isFriend || false
      }
    }

    const data = Buffer.from(JSON.stringify(peerInfo))
    await ipfs.files.write(getPeerInfoPath(peerId), data, {
      create: true,
      parents: true,
      truncate: true
    })

    syndicate.publish({ action, id: peerInfo.id, peerInfo })
  }
}
