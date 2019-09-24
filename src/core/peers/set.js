const { Buffer } = require('buffer')
const Validate = require('./validate')

module.exports = ({
  ipfs,
  getMutex,
  peerExists,
  syndicate,
  getProfilePath,
  getProfile
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

    const mutex = getMutex(peerId)
    const release = await mutex.writeLock()

    try {
      const exists = await peerExists(peerId)
      let profile
      let action

      if (exists) {
        action = 'change'
        profile = await getProfile(peerId)

        if (details.name || details.name === null) {
          profile.name = details.name
        }

        if (details.avatar || details.avatar === null) {
          profile.avatar = details.avatar
        }

        if (details.lastSeenAt) {
          profile.lastSeenAt = details.lastSeenAt
        }

        if (details.lastMessage) {
          profile.lastMessage = details.lastMessage
        }
      } else {
        action = 'add'
        profile = {
          id: peerId,
          name: details.name,
          avatar: details.avatar,
          lastSeenAt: details.lastSeenAt,
          lastMessage: details.lastMessage
        }
      }

      const data = Buffer.from(JSON.stringify(profile))
      await ipfs.files.write(getProfilePath(peerId), data, {
        create: true,
        parents: true
      })

      syndicate.publish({ action, id: profile.id, profile })
    } finally {
      release()
    }
  }
}
