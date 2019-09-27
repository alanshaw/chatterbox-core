const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const pipe = require('it-pipe')
const log = require('debug')('chatterbox-core:messages:feed')
const Validate = require('./validate')

module.exports = ({ getMessagesList, syndicate }) => {
  return (peerId, options) => {
    Validate.peerId(peerId)
    options = options || {}

    return (async function * () {
      if (options.signal && options.signal.aborted) throw new AbortError()

      // Stash the pushable for the feed so that any updates
      // that happen while yielding local messages are also yielded
      const source = pushable({ writev: true })
      syndicate.join(source)

      try {
        let messages = []

        const updater = source => (async function * () {
          // Yield local peer cache first
          messages = await getMessagesList(peerId)

          yield Array.from(messages)

          for await (const diffs of source) {
            messages = diffs.reduce((messages, diff) => {
              if (diff.action === 'add') {
                return messages.concat(diff.message)
              } else if (diff.action === 'change') {
                return messages.map(p => p.id === diff.id ? diff.message : p)
              } else if (diff.action === 'remove') {
                return messages.filter(p => p.id !== diff.id)
              }
              log(`unknown action: "${diff.action}"`)
              return messages
            }, messages)

            yield Array.from(messages)
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
