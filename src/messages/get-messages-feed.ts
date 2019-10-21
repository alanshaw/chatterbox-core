const abortable = require('abortable-iterator')
const { AbortError } = require('abortable-iterator')
const pushable = require('it-pushable')
const pipe = require('it-pipe')
const log = require('debug')('chatterbox-core:messages:feed')
const clone = require('clone-deep')
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

          yield clone(messages)

          for await (const diffs of source) {
            const oldMessages = messages

            messages = diffs.reduce((messages, diff) => {
              if (diff.peerId !== peerId) return messages

              if (diff.action === 'add') {
                return messages.concat(diff.message)
              } else if (diff.action === 'change') {
                return messages.map(m => m.id === diff.messageId ? diff.message : m)
              } else if (diff.action === 'remove') {
                return messages.filter(m => m.id !== diff.messageId)
              }

              log(`unknown action: "${diff.action}"`)
              return messages
            }, messages)

            if (messages !== oldMessages) {
              yield clone(messages)
            }
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
