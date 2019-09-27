import test from 'ava'
import hat from 'hat'
import AddMessage from '../../../src/messages/add-message'

test('should validate passed peer ID', async t => {
  const ipfs = {}
  const peers = {}
  const friends = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  const err = await t.throwsAsync(addMessage(null))

  t.is(err.message, 'invalid peer ID')
})

test('should validate passed text', async t => {
  const ipfs = {}
  const peers = {}
  const friends = {}
  const syndicate = {}
  const getMessagesPath = () => {}
  const getMessagesList = () => {}
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  const err = await t.throwsAsync(addMessage(hat(), null))

  t.is(err.message, 'invalid message text')
})

test('should add a message for a peer', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()
  const text = hat()
  let messages = [{
    id: hat(),
    text: hat(),
    receivedAt: Date.now()
  }]
  const friendsList = []

  const ipfs = {
    _id: hat(),
    id: () => ({ id: ipfs._id }),
    files: {
      write: (path, data) => {
        t.is(path, getMessagesPath(peerId))
        messages = JSON.parse(data)
      }
    }
  }
  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => friendsList }
  const syndicate = { publish: () => {} }
  const getMessagesPath = peerId => `${repoDir}/${peerId}/messages.json`
  const getMessagesList = () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  await addMessage(peerId, text)

  t.is(messages.length, 1) // Only the last message per peer is retained
  t.deepEqual(messages[0].text, text)
})

test('should add a message for a friend', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()
  const text = hat()
  const message = {
    id: hat(),
    text: hat(),
    receivedAt: Date.now()
  }
  let messages = [message]
  const friendsList = [peerId]

  const ipfs = {
    _id: hat(),
    id: () => ({ id: ipfs._id }),
    files: {
      write: (path, data) => {
        t.is(path, getMessagesPath(peerId))
        messages = JSON.parse(data)
      }
    }
  }
  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => friendsList }
  const syndicate = { publish: () => {} }
  const getMessagesPath = peerId => `${repoDir}/${peerId}/messages.json`
  const getMessagesList = () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  await addMessage(peerId, text)

  t.is(messages.length, 2)
  t.deepEqual(messages[0], message)
  t.deepEqual(messages[1].text, text)
})

test('should limit message history for friends', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()
  const text = hat()
  const message = {
    id: hat(),
    text: hat(),
    receivedAt: Date.now()
  }
  let messages = [message]
  const friendsList = [peerId]

  const ipfs = {
    _id: hat(),
    id: () => ({ id: ipfs._id }),
    files: {
      write: (path, data) => {
        t.is(path, getMessagesPath(peerId))
        messages = JSON.parse(data)
      }
    }
  }
  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => friendsList }
  const syndicate = { publish: () => {} }
  const getMessagesPath = peerId => `${repoDir}/${peerId}/messages.json`
  const getMessagesList = () => messages
  const friendsMessageHistorySize = 1

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  await addMessage(peerId, text)

  t.is(messages.length, 1)
  t.deepEqual(messages[0].text, text)
})

test('should add a message from self', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()
  const text = hat()
  const message = {
    id: hat(),
    text: hat(),
    receivedAt: Date.now()
  }
  let messages = [message]
  const friendsList = []

  const ipfs = {
    id: () => ({ id: peerId }),
    files: {
      write: (path, data) => {
        t.is(path, getMessagesPath(peerId))
        messages = JSON.parse(data)
      }
    }
  }
  const peers = { __unsafe__: { set: () => {} } }
  const friends = { list: () => friendsList }
  const syndicate = { publish: () => {} }
  const getMessagesPath = peerId => `${repoDir}/${peerId}/messages.json`
  const getMessagesList = () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    friends,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  await addMessage(peerId, text)

  t.is(messages.length, 2)
  t.deepEqual(messages[0], message)
  t.deepEqual(messages[1].text, text)
})
