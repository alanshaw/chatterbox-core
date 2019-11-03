import test from 'ava'
import hat from 'hat'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { fakePeerId } from '../../_helpers'
import AbortController from 'abort-controller'
import GetMessagesFeed from '../../../src/messages/get-messages-feed'
import Syndicate from '../../../src/lib/syndicate'
import { MessageDiff } from '../../../src/messages/MessageDiff'
import { Message } from '../../../src/messages/message'
import { AbortError } from 'abortable-iterator'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesList = (peerId: string) => Promise.resolve([] as Message[])

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })

  let err: Error

  err = t.throws(() => getMessagesFeed(''))
  t.is(err.message, 'invalid peer ID')

  err = t.throws(() => getMessagesFeed('NOT A PEER ID'))
  t.is(err.message, 'invalid peer ID')
})

test('should yield when messages are added', async t => {
  const peerId = fakePeerId()
  const messages = [fakeMessage(), fakeMessage(), fakeMessage()]

  const diffs: MessageDiff[] = [{
    action: 'add',
    peerId,
    messageId: messages[0].id,
    message: messages[0]
  }, {
    action: 'add',
    peerId: fakePeerId(), // Not for for our peer
    messageId: messages[1].id,
    message: messages[1]
  }, {
    action: 'add',
    peerId,
    messageId: messages[2].id,
    message: messages[2]
  }]

  const getMessagesList = (peerId: string) => Promise.resolve([] as Message[])
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  syndicate.join(Arg.any()).mimicks(source => {
    diffs.forEach((diff, i) => {
      setTimeout(() => source.push(diff), i * 10)
    })
  })

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [])
  t.deepEqual((await messagesFeed.next()).value, [messages[0]])
  t.deepEqual((await messagesFeed.next()).value, [messages[0], messages[2]])

  messagesFeed.return()
})

test('should yield when a message is removed', async t => {
  const peerId = fakePeerId()
  const message = fakeMessage()
  const diff: MessageDiff = { action: 'remove', peerId, messageId: message.id }

  const getMessagesList = (peerId: string) => Promise.resolve([message])
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  syndicate.join(Arg.any()).mimicks(source => {
    setTimeout(() => source.push(diff), 10)
  })

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [message])
  t.deepEqual((await messagesFeed.next()).value, [])

  messagesFeed.return()
})

test('should yield when a message is changed', async t => {
  const peerId = fakePeerId()
  const message = fakeMessage()
  const changedMessage = { ...message, readAt: Date.now() }
  const diff: MessageDiff = {
    action: 'change',
    peerId,
    messageId: message.id,
    message: changedMessage
  }

  const getMessagesList = (peerId: string) => Promise.resolve([message])
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  syndicate.join(Arg.any()).mimicks(source => {
    setTimeout(() => source.push(diff), 10)
  })

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const messagesFeed = getMessagesFeed(peerId)

  t.deepEqual((await messagesFeed.next()).value, [message])
  t.deepEqual((await messagesFeed.next()).value, [changedMessage])

  messagesFeed.return()
})

test('should be aborted by a signal', async t => {
  const peerId = fakePeerId()
  let interval

  const getMessagesList = (peerId: string) => Promise.resolve([] as Message[])
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  syndicate.join(Arg.any()).mimicks(source => {
    interval = setInterval(() => {
      const message = fakeMessage()
      source.push({ action: 'add', peerId, messageId: message.id, message })
    }, 10)
  })

  const getMessagesFeed = GetMessagesFeed({ getMessagesList, syndicate })
  const controller = new AbortController()
  const messagesFeed = getMessagesFeed(peerId, { signal: controller.signal })

  setTimeout(() => controller.abort(), 100)

  const err = await t.throwsAsync<AbortError>(async () => {
    for await (const messages of messagesFeed) { // eslint-disable-line no-unused-vars
      // noop
    }
  })

  t.is(err.type, 'aborted')
  clearInterval(interval)
})
