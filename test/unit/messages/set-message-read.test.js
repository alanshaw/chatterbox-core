import test from 'ava'
import hat from 'hat'
import SetMessageRead from '../../../src/messages/set-message-read'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const ipfs = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}

  const setMessageRead = SetMessageRead({
    ipfs,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  const err = await t.throwsAsync(setMessageRead(null))

  t.is(err.message, 'invalid peer ID')
})

test('should validate passed message ID', async t => {
  const ipfs = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}

  const setMessageRead = SetMessageRead({
    ipfs,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  const err = await t.throwsAsync(setMessageRead(hat(), null))

  t.is(err.message, 'invalid message ID')
})

test('should set message read time', async t => {
  const peerId = hat()
  let messages = [fakeMessage()]

  const ipfs = {
    files: {
      write (path, data) {
        messages = JSON.parse(data)
      }
    }
  }
  const syndicate = { publish: () => {} }
  const getMessagesPath = () => {}
  const getMessagesList = () => messages

  const setMessageRead = SetMessageRead({
    ipfs,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, messages[0].id)

  t.true(messages[0].readAt <= Date.now())
})

test('should not set message read time if not exists', async t => {
  const peerId = hat()
  let messages = [fakeMessage()]

  const ipfs = {
    files: {
      write (path, data) {
        messages = JSON.parse(data)
      }
    }
  }
  const syndicate = { publish: () => {} }
  const getMessagesPath = () => {}
  const getMessagesList = () => messages

  const setMessageRead = SetMessageRead({
    ipfs,
    getMessagesList,
    getMessagesPath,
    syndicate
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, hat())

  t.falsy(messages[0].readAt)
})
