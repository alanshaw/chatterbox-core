const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const map = require('p-map')
const pipe = require('it-pipe')
const keepAlive = require('it-keepalive')

const Yes = () => true

module.exports = ({ ipfs, getPeersPath, getProfile, syndicate }) => {
  return options => {
    options = options || {}
    options.filter = options.filter || Yes

    return (async function * () {
      if (options.signal && options.signal.aborted) throw new AbortError()

      // Stash the pushable for the feed so that any updates
      // that happen while yielding local peer cache are also yielded
      const source = pushable({ writev: true })
      syndicate.join(source)

      try {
        let peers = []

        const updater = source => (async function * () {
          // Yield local peer cache first
          try {
            peers = await ipfs.files.ls(getPeersPath())
          } catch (err) {
            if (err.code === 'ERR_NOT_FOUND' || err.message === 'file does not exist') {
              peers = []
            } else {
              throw err
            }
          }

          peers = await map(peers, peerId => getProfile(peerId), { concurrency: 8 })
          peers = peers.filter(Boolean).filter(options.filter)

          yield Array.from(peers)

          for await (const diffs of source) {
            peers = diffs
              .reduce((peers, diff) => {
                if (diff.action === 'add') {
                  return peers.concat(diff.profile)
                } else if (diff.action === 'change') {
                  return peers.map(p => p.id === diff.id ? diff.profile : p)
                } else if (diff.action === 'remove') {
                  return peers.filter(p => p.id !== diff.id)
                } else {
                  throw new Error(`unknown action: "${diff.action}"`)
                }
              }, peers)
              .filter(options.filter)

            yield Array.from(peers)
          }
        })()

        yield * pipe(
          options.signal ? abortable(source, options.signal) : source,
          updater,
          keepAlive(() => peers, {
            shouldKeepAlive () {
              const filteredPeers = peers.filter(options.filter)
              if (filteredPeers.length === peers.length) return false
              peers = filteredPeers
              return true
            }
          })
        )
      } finally {
        syndicate.leave(source)
      }
    })()
  }
}
