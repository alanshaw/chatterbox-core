import abortable, { AbortError } from 'abortable-iterator'
import pushable from 'it-pushable'
import pipe from 'it-pipe'
import debug from 'debug'
import clone from 'clone-deep'
import * as Validate from './validate'
import GetMessagesList from './get-messages-list'
import Syndicate from '../lib/syndicate'
import { MessageDiff } from './MessageDiff'
import { Message } from './message'

const log = debug('chatterbox-core:messages:feed')

type Deps = {
  getMessagesList: ReturnType<typeof GetMessagesList>
  syndicate: Syndicate<MessageDiff>
}

type Options = {
  signal?: AbortSignal
}

export default ({ getMessagesList, syndicate }: Deps) => {
  return (peerId: string, options?: Options) => {
    Validate.peerId(peerId)
    options = options || {}

    return (async function * () {
      if (options.signal && options.signal.aborted) throw new AbortError()

      // Stash the pushable for the feed so that any updates
      // that happen while yielding local messages are also yielded
      const source = pushable<MessageDiff>({ writev: true })
      syndicate.join(source)

      try {
        let messages: Message[] = []

        const updater = (source: AsyncIterable<MessageDiff[]>) => (async function * () {
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

        yield * pipe<AsyncIterable<MessageDiff[]>, AsyncIterable<Message[]>>(
          options.signal ? abortable(source, options.signal) : source,
          updater
        )
      } finally {
        syndicate.leave(source)
      }
    })()
  }
}
