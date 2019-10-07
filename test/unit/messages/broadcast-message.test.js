import test from 'ava'
import hat from 'hat'
import defer from 'p-defer'
import { fakePeerId } from '../../_helpers'
import BroadcastMessage from '../../../src/messages/broadcast-message'

test('should validate passed text', async t => {
  const ipfs = {}
  const addMessage = () => {}
  const broadcastTopic = '/test/broadcast'

  const broadcastMessage = BroadcastMessage({ ipfs, addMessage, broadcastTopic })

  const err = await t.throwsAsync(broadcastMessage(null))

  t.is(err.message, 'invalid message text')
})

test('should broadcast a message', async t => {
  const text = hat()
  const added = defer()
  const published = defer()

  const ipfs = {
    _id: fakePeerId(),
    id: () => ({ id: ipfs._id }),
    pubsub: {
      publish (topic, data) {
        t.is(topic, broadcastTopic)
        t.is(JSON.parse(data).text, text)
        published.resolve()
      }
    }
  }
  const addMessage = (id, txt) => {
    t.is(txt, text)
    added.resolve()
  }
  const broadcastTopic = '/test/broadcast'

  const broadcastMessage = BroadcastMessage({ ipfs, addMessage, broadcastTopic })

  await broadcastMessage(text)

  await added.promise
  await published.promise
})
