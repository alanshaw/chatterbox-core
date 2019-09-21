const { Buffer } = require('buffer')
const mortice = require('mortice')
const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const toIterable = require('pull-stream-to-async-iterator')
const Validate = require('./validate')

const Yes = () => true

module.exports = ({ ipfs, config }) => {
  const getPeersPath = () => `${config.repoDir}/peers`
  const getPeerPath = peerId => `${getPeersPath()}/${peerId}`
  const getProfilePath = peerId => `${getPeerPath(peerId)}/profile.json`

  const getMutex = (() => {
    const lockers = {}
    return peerId => {
      lockers[peerId] = lockers[peerId] || mortice(peerId)
      return lockers[peerId]
    }
  })()

  const peerExists = async peerId => {
    try {
      await ipfs.files.stat(getPeerPath(peerId))
      return true
    } catch (err) {
      return false // TODO: pick out not found error
    }
  }

  let feeds = []
  const pushToFeeds = profile => {
    feeds.forEach(({ source, filter }) => {
      if (filter(profile)) source.push(profile)
    })
  }

  const api = {
    async get (peerId) {
      if (typeof peerId !== 'string' || !peerId) {
        throw new Error('invalid peer ID')
      }

      const mutex = getMutex(peerId)
      const release = await mutex.readLock()

      try {
        const exists = await peerExists(peerId)
        if (!exists) return null

        const data = await ipfs.files.read(getProfilePath(peerId))
        return JSON.parse(data)
      } finally {
        release()
      }
    },

    async set (peerId, details) {
      if (typeof peerId !== 'string' || !peerId) {
        throw new Error('invalid peer ID')
      }

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

        if (exists) {
          profile = await api.get(peerId)

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

        pushToFeeds(profile)
      } finally {
        release()
      }
    },

    feed (options) {
      options = options || {}
      options.filter = options.filter || Yes

      return (async function * () {
        if (options.signal && options.signal.aborted) throw new AbortError()

        // Stash the pushable for the feed so that any updates
        // that happen while yielding local peer cache are also yielded
        const source = pushable()
        feeds.push({ source, filter: options.filter })

        try {
          // Yield local peer cache first
          let peerIdStream = toIterable(ipfs.files.lsPullStream(getPeersPath()))

          if (options.signal) {
            peerIdStream = abortable(peerIdStream, options.signal)
          }

          for await (const peerId of peerIdStream) {
            const profile = api.get(getProfilePath(peerId))
            if (options.filter(profile)) yield profile
          }

          // Now yield updates
          yield * options.signal ? abortable(source, options.signal) : source
        } finally {
          feeds = feeds.filter(f => f.source !== source)
        }
      })()
    }
  }

  return api
}
