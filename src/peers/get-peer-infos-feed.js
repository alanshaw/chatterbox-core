const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const map = require('p-map')
const pipe = require('it-pipe')
const keepAlive = require('it-keepalive')
const log = require('debug')('chatterbox-core:messages:feed')
const clone = require('clone-deep')

const Yes = () => true

module.exports = ({ ipfs, peersPath, getPeerInfo, syndicate }) => {
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
          let files
          try {
            files = await ipfs.files.ls(peersPath)
          } catch (err) {
            if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
              files = []
            } else {
              throw err
            }
          }

          peers = await map(files, f => getPeerInfo(f.name), { concurrency: 8 })
          peers = peers.filter(options.filter)

          yield clone(peers)

          for await (const diffs of source) {
            peers = diffs
              .reduce((peers, diff) => {
                if (diff.action === 'add') {
                  return peers.concat(diff.peerInfo)
                } else if (diff.action === 'change') {
                  const index = peers.findIndex(p => p.id === diff.id)
                  if (index > -1) {
                    peers[index] = diff.peerInfo
                    return peers
                  } else if (options.filter(diff.peerInfo)) {
                    return peers.concat(diff.peerInfo)
                  }
                  return peers
                } else if (diff.action === 'remove') {
                  return peers.filter(p => p.id !== diff.id)
                }
                log(`unknown action: "${diff.action}"`)
                return peers
              }, peers)
              .filter(options.filter)

            yield clone(peers)
          }
        })()

        yield * pipe(
          options.signal ? abortable(source, options.signal) : source,
          updater,
          keepAlive(() => clone(peers), {
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
