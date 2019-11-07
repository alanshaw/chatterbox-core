import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import defer from 'p-defer'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { pause, fakePeerId } from '../_helpers'
import MutexManager from '../../src/lib/mutex-manager'
import Messages, { MessagesApi } from '../../src/messages'
import { PubSubMessage, CoreApi, PubSubHandler } from 'ipfs'
import { Message } from '../../src/messages/message'
import { PeersApi } from '../../src/peers'

const fakePubSubMessage = (from: string, data: Buffer | { version?: string, text?: string }): PubSubMessage => ({
  seqno: Buffer.from(hat().toString()),
  from,
  data: Buffer.isBuffer(data)
    ? data
    : Buffer.from(JSON.stringify({ version: '1.0.0', ...data }))
})

const collectMessages = async (api: MessagesApi, forPeerId: string, signal: AbortSignal) => {
  let messagesList: Message[] = []
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

  const ownPeerId = fakePeerId()
  const ownMessages = [hat(), hat(), hat()]

  const externalPeerId = fakePeerId()
  const externalMessages = [hat(), hat(), hat()]

  const data: { [path: string]: Buffer } = {}

  const subscribed = defer<PubSubHandler>()

  const ipfs = Substitute.for<CoreApi>()
  ipfs.id().returns(Promise.resolve({ id: ownPeerId }))

  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(Arg.is(path => typeof path === 'string' && path.startsWith(peersPath)))
    .mimicks(async (path, d) => { data[path] = d })

  files.read(Arg.is(path => typeof path === 'string' && path.startsWith(peersPath)))
    .mimicks(async path => {
      if (!data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      return data[path]
    })

  const pubSub = Substitute.for<typeof ipfs.pubsub>()
  if (ipfs.pubsub.returns) ipfs.pubsub.returns(pubSub)

  pubSub.subscribe(broadcastTopic, Arg.any())
    .mimicks(async (_, handler) => { subscribed.resolve(handler) })

  pubSub.publish(broadcastTopic, Arg.any()).returns(Promise.resolve())

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(ownPeerId).returns(Promise.resolve({ id: ownPeerId }))
  peersUnsafe.get(externalPeerId).returns(Promise.resolve({ id: externalPeerId, isFriend: true }))

  const messages = await Messages({
    ipfs,
    mutexManager,
    peers,
    config: {
      peersPath,
      repoDir: '/test',
      topics: {
        broadcast: broadcastTopic,
        beacon: '/test/beacon'
      },
      friendsMessageHistorySize: 1000,
      beaconInterval: 5 * 60 * 1000
    }
  })

  const controller = new AbortController()

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
            handler(fakePubSubMessage(externalPeerId, { text }))
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

  const ownPeerId = fakePeerId()
  const badActorPeerId = fakePeerId()

  const data: { [path: string]: Buffer } = {}

  const subscribed = defer<PubSubHandler>()

  const ipfs = Substitute.for<CoreApi>()
  ipfs.id().returns(Promise.resolve({ id: ownPeerId }))

  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(Arg.is(path => typeof path === 'string' && path.startsWith(peersPath)))
    .mimicks(async (path, d) => { data[path] = d })

  files.read(Arg.is(path => typeof path === 'string' && path.startsWith(peersPath)))
    .mimicks(async path => {
      if (!data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      return data[path]
    })

  const pubSub = Substitute.for<typeof ipfs.pubsub>()
  if (ipfs.pubsub.returns) ipfs.pubsub.returns(pubSub)

  pubSub.subscribe(broadcastTopic, Arg.any())
    .mimicks(async (_, handler) => { subscribed.resolve(handler) })

  pubSub.publish(broadcastTopic, Arg.any()).returns(Promise.resolve())

  const peers = Substitute.for<PeersApi>()

  const messages = await Messages({
    ipfs,
    mutexManager,
    peers,
    config: {
      peersPath,
      repoDir: '/test',
      topics: {
        broadcast: broadcastTopic,
        beacon: '/test/beacon'
      },
      friendsMessageHistorySize: 1000,
      beaconInterval: 5 * 60 * 1000
    }
  })

  const controller = new AbortController()

  const [badActorFeedMessages] = await Promise.all([
    collectMessages(messages, badActorPeerId, controller.signal),
    (async () => {
      const handler = await subscribed.promise
      const badMessages = [
        fakePubSubMessage(badActorPeerId, Buffer.from('{')),
        fakePubSubMessage(badActorPeerId, { text: '' }),
        fakePubSubMessage(badActorPeerId, { version: '0.0.1' }),
        fakePubSubMessage(ownPeerId, { text: 'From myself' })
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
