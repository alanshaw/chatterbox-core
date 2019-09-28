import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import defer from 'p-defer'
import { pause } from '../_helpers'
import MutexManager from '../../src/lib/mutex-manager'
import Messages from '../../src/messages'

const fakePubsubChatMsg = (from, data) => ({
  seqno: hat(),
  from,
  data: Buffer.isBuffer(data)
    ? data
    : Buffer.from(JSON.stringify({ version: '1.0.0', ...data }))
})

const collectMessages = async (api, forPeerId, signal) => {
  let messagesList = []
  const feed = api.feed(forPeerId, { signal })
  try {
    for await (const list of feed) {
      messagesList = list
    }
  } catch (err) {
    if (err.type !== 'aborted') throw err
  }
  return messagesList
}

test('should broadcast and receive messages', async t => {
  const peersPath = `/TEST-${Date.now()}/peers`
  const broadcastTopic = `/test/broadcast/${Date.now()}`
  const mutexManager = MutexManager()

  const subscribed = defer()

  const ipfs = {
    _id: hat(),
    _data: {},
    id: () => ({ id: ipfs._id }),
    files: {
      read: path => {
        t.true(path.startsWith(peersPath))
        if (!ipfs._data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
        return ipfs._data[path]
      },
      write: (path, data) => {
        t.true(path.startsWith(peersPath))
        ipfs._data[path] = data
      }
    },
    pubsub: {
      subscribe (topic, handler) {
        t.is(topic, broadcastTopic)
        subscribed.resolve(handler)
      },
      publish: topic => {
        t.is(topic, broadcastTopic)
      }
    }
  }

  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => externalPeerId }

  const messages = await Messages({
    ipfs,
    mutexManager,
    peers,
    friends,
    config: {
      peersPath,
      topics: { broadcast: broadcastTopic },
      friendsMessageHistorySize: 1000
    }
  })

  const controller = new AbortController()

  const ownPeerId = ipfs._id
  const ownMessages = [hat(), hat(), hat()]

  const externalPeerId = hat()
  const externalMessages = [hat(), hat(), hat()]

  const [ownFeedMessages, externalFeedMessages] = await Promise.all([
    collectMessages(messages, ownPeerId, controller.signal),
    collectMessages(messages, externalPeerId, controller.signal),
    (async () => {
      const handler = await subscribed.promise

      await Promise.all([
        (async () => {
          for (const text of ownMessages) {
            await messages.broadcast(text)
            await pause(10)
          }
        })(),
        (async () => {
          for (const text of externalMessages) {
            handler(fakePubsubChatMsg(externalPeerId, { text }))
            await pause(10)
          }
        })()
      ])

      controller.abort()
    })()
  ])

  t.deepEqual(ownFeedMessages.map(m => m.text), ownMessages)
  t.deepEqual(externalFeedMessages.map(m => m.text), externalMessages)
})

test('should ignore invalid messages', async t => {
  const peersPath = `/TEST-${Date.now()}/peers`
  const broadcastTopic = `/test/broadcast/${Date.now()}`
  const mutexManager = MutexManager()

  const subscribed = defer()

  const ipfs = {
    _id: hat(),
    _data: {},
    id: () => ({ id: ipfs._id }),
    files: {
      read: path => {
        t.true(path.startsWith(peersPath))
        if (!ipfs._data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
        return ipfs._data[path]
      },
      write: (path, data) => {
        t.true(path.startsWith(peersPath))
        ipfs._data[path] = data
      }
    },
    pubsub: {
      subscribe (topic, handler) {
        t.is(topic, broadcastTopic)
        subscribed.resolve(handler)
      },
      publish: topic => {
        t.is(topic, broadcastTopic)
      }
    }
  }

  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => [] }

  const messages = await Messages({
    ipfs,
    mutexManager,
    peers,
    friends,
    config: {
      peersPath,
      topics: { broadcast: broadcastTopic },
      friendsMessageHistorySize: 1000
    }
  })

  const controller = new AbortController()

  const badActorPeerId = hat()

  const [badActorFeedMessages] = await Promise.all([
    collectMessages(messages, badActorPeerId, controller.signal),
    (async () => {
      const handler = await subscribed.promise
      const badMessages = [
        fakePubsubChatMsg(badActorPeerId, Buffer.from('{')),
        fakePubsubChatMsg(badActorPeerId, { text: null }),
        fakePubsubChatMsg(badActorPeerId, { version: '0.0.1' }),
        fakePubsubChatMsg(ipfs._id, { text: 'From myself' })
      ]

      for (const msg of badMessages) {
        handler(msg)
        await pause(10)
      }

      controller.abort()
    })()
  ])

  t.deepEqual(badActorFeedMessages, [])
})
