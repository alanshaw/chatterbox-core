import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import GetMessagesFeed from '../../../src/messages/get-messages-feed'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const syndicate = {}
  const getMessagesList = () => {}

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })

  const err = t.throws(() => getMessagesFeed(null))

  t.is(err.message, 'invalid peer ID')
})

test('should yield when messages are added', async t => {
  const peerId = hat()
  const messages = [fakeMessage(), fakeMessage(), fakeMessage()]

  const diffs = [{
    action: 'add',
    peerId,
    messageId: messages[0].id,
    message: messages[0]
  }, {
    action: 'add',
    peerId: hat(), // Not for for our peer
    messageId: messages[1].id,
    message: messages[1]
  }, {
    action: 'add',
    peerId,
    messageId: messages[2].id,
    message: messages[2]
  }]

  const getMessagesList = () => []
  const syndicate = {
    join: source => {
      diffs.forEach((diff, i) => {
        setTimeout(() => source.push(diff), i * 10)
      })
    },
    leave: () => {}
  }

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [])
  t.deepEqual((await messagesFeed.next()).value, [messages[0]])
  t.deepEqual((await messagesFeed.next()).value, [messages[0], messages[2]])

  messagesFeed.return()
})

test('should yield when a message is removed', async t => {
  const peerId = hat()
  const message = fakeMessage()
  const diff = { action: 'remove', peerId, messageId: message.id }

  const getMessagesList = () => [message]
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [message])
  t.deepEqual((await messagesFeed.next()).value, [])

  messagesFeed.return()
})

test('should yield when a message is changed', async t => {
  const peerId = hat()
  const message = fakeMessage()
  const changedMessage = { ...message, readAt: Date.now() }
  const diff = {
    action: 'change',
    peerId,
    messageId: message.id,
    message: changedMessage
  }

  const getMessagesList = () => [message]
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [message])
  t.deepEqual((await messagesFeed.next()).value, [changedMessage])

  messagesFeed.return()
})

test('should be aborted by a signal', async t => {
  const peerId = hat()
  let interval

  const getMessagesList = () => []
  const syndicate = {
    join: source => {
      interval = setInterval(() => {
        const message = fakeMessage()
        source.push({ action: 'add', peerId, messageId: message.id, message })
      }, 10)
    },
    leave: () => {}
  }

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const controller = new AbortController()
  const messagesFeed = getMessagesFeed(peerId, { signal: controller.signal })

  setTimeout(() => controller.abort(), 100)

  const err = await t.throwsAsync(async () => {
    for await (const messages of messagesFeed) { // eslint-disable-line no-unused-vars
      // noop
    }
  })

  t.is(err.type, 'aborted')
  clearInterval(interval)
})
