import test from 'ava'
import hat from 'hat'
import { fakePeerId } from '../../_helpers'
import SetMessageRead from '../../../src/messages/set-message-read'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const ipfs = {}
  const peers = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  let err

  err = await t.throwsAsync(setMessageRead(null))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(setMessageRead('NOT A PEER ID'))
  t.is(err.message, 'invalid peer ID')
})

test('should validate passed message ID', async t => {
  const ipfs = {}
  const peers = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  const err = await t.throwsAsync(setMessageRead(fakePeerId(), null))

  t.is(err.message, 'invalid message ID')
})

test('should set message read time', async t => {
  const peerId = fakePeerId()
  let messages = [fakeMessage()]

  const ipfs = {
    files: {
      write (path, data) {
        messages = JSON.parse(data)
      }
    }
  }
  const peers = {
    __unsafe__: {
      get: () => ({ lastMessage: { id: hat() } }),
      set: () => {}
    }
  }
  const syndicate = { publish: () => {} }
  const getMessagesPath = () => {}
  const getMessagesList = () => messages

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, messages[0].id)

  t.true(messages[0].readAt <= Date.now())
})

test('should not set message read time if not exists', async t => {
  const peerId = fakePeerId()
  let messages = [fakeMessage()]

  const ipfs = {
    files: {
      write (path, data) {
        messages = JSON.parse(data)
      }
    }
  }
  const peers = {
    __unsafe__: {
      get: () => null,
      set: () => {}
    }
  }
  const syndicate = { publish: () => {} }
  const getMessagesPath = () => {}
  const getMessagesList = () => messages

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, hat())

  t.falsy(messages[0].readAt)
})

test('should set last message read time', async t => {
  const peerId = fakePeerId()
  const message = fakeMessage()
  let messages = [{ ...message }]
  const peerInfo = {
    id: peerId,
    lastMessage: { ...message }
  }

  const ipfs = {
    files: {
      write (path, data) {
        messages = JSON.parse(data)
      }
    }
  }
  const peers = {
    __unsafe__: {
      get: () => peerInfo,
      set: (id, { lastMessage }) => {
        peerInfo.lastMessage = lastMessage
      }
    }
  }
  const syndicate = { publish: () => {} }
  const getMessagesPath = () => {}
  const getMessagesList = () => messages

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, messages[0].id)

  t.true(messages[0].readAt <= Date.now())
  t.is(peerInfo.lastMessage.readAt, messages[0].readAt)
})
