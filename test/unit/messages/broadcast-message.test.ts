import test from 'ava'
import hat from 'hat'
import defer from 'p-defer'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import { fakePeerId } from '../../_helpers'
import BroadcastMessage from '../../../src/messages/broadcast-message'

test('should validate passed text', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const addMessage = (peerId: string, text: string) => Promise.resolve()
  const broadcastTopic = '/test/broadcast'

  const broadcastMessage = BroadcastMessage({ ipfs, addMessage, broadcastTopic })

  const err = await t.throwsAsync(broadcastMessage(''))

  t.is(err.message, 'invalid message text')
})

test('should broadcast a message', async t => {
  const text = hat()
  const added = defer()
  const published = defer()
  const broadcastTopic = '/test/broadcast'

  const ipfs = Substitute.for<CoreApi>()
  const pubsub = Substitute.for<typeof ipfs.pubsub>()
  if (ipfs.pubsub.returns) ipfs.pubsub.returns(pubsub)

  ipfs.id().returns(Promise.resolve({ id: fakePeerId() }))

  pubsub.publish(broadcastTopic, Arg.any()).mimicks(async (topic: string, data: Buffer) => {
    t.is(JSON.parse(data.toString()).text, text)
    published.resolve()
  })

  const addMessage = async (peerId: string, txt: string) => {
    t.is(txt, text)
    added.resolve()
  }

  const broadcastMessage = BroadcastMessage({ ipfs, addMessage, broadcastTopic })

  await broadcastMessage(text)

  await added.promise
  await published.promise
})
