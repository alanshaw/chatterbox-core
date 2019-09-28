const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({
  ipfs,
  getPeerPath,
  getPeer,
  syndicate
}) => {
  return async (peerId, details) => {
    Validate.peerId(peerId)

    details = details || {}

    if (details.name != null) {
      Validate.name(details.name)
    }

    if (details.avatar != null) {
      Validate.avatar(details.avatar)
    }

    if (details.lastSeenAt != null) {
      Validate.lastSeenAt(details.lastSeenAt)
    }

    if (details.lastMessage != null) {
      Validate.lastMessage(details.lastMessage)
    }

    let exists
    try {
      await ipfs.files.stat(getPeerPath(peerId))
      exists = true
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
        exists = false
      } else {
        throw err
      }
    }

    let peer, action

    if (exists) {
      action = 'change'
      peer = await getPeer(peerId)

      if (details.name || details.name === null) {
        peer.name = details.name
      }

      if (details.avatar || details.avatar === null) {
        peer.avatar = details.avatar
      }

      if (details.lastSeenAt) {
        peer.lastSeenAt = details.lastSeenAt
      }

      if (details.lastMessage) {
        peer.lastMessage = details.lastMessage
      }
    } else {
      action = 'add'
      peer = {
        id: peerId,
        name: details.name,
        avatar: details.avatar,
        lastSeenAt: details.lastSeenAt,
        lastMessage: details.lastMessage
      }
    }

    const data = Buffer.from(JSON.stringify(peer))
    await ipfs.files.write(getPeerPath(peerId), data, {
      create: true,
      parents: true
    })

    syndicate.publish({ action, id: peer.id, peer })
  }
}
