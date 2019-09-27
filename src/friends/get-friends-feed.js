const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const pipe = require('it-pipe')
const log = require('debug')('chatterbox-core:friends:feed')

module.exports = ({ getFriendsList, syndicate }) => {
  return options => {
    options = options || {}

    return (async function * () {
      if (options.signal && options.signal.aborted) throw new AbortError()

      // Stash the pushable for the feed so that any updates
      // that happen while yielding local friend cache are also yielded
      const source = pushable({ writev: true })
      syndicate.join(source)

      try {
        const updater = source => (async function * () {
          let peerIds = await getFriendsList()

          yield Array.from(peerIds)

          for await (const diffs of source) {
            peerIds = diffs
              .reduce((peerIds, diff) => {
                if (diff.action === 'add') {
                  return peerIds.concat(diff.id)
                } else if (diff.action === 'remove') {
                  return peerIds.filter(id => id !== diff.id)
                }
                log(`unknown action: "${diff.action}"`)
                return peerIds
              }, peerIds)

            yield Array.from(peerIds)
          }
        })()

        yield * pipe(
          options.signal ? abortable(source, options.signal) : source,
          updater
        )
      } finally {
        syndicate.leave(source)
      }
    })()
  }
}
