import test from 'ava'
import hat from 'hat'
import { Substitute, Arg } from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import { fakePeerId } from '../../_helpers'
import AddMessage from '../../../src/messages/add-message'
import { PeersApi } from '../../../src/peers'
import Syndicate from '../../../src/lib/syndicate'
import { MessageDiff } from '../../../src/messages/MessageDiff'
import { Message } from '../../../src/messages/Message'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const peers = Substitute.for<PeersApi>()
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesPath = (peerId: string) => ''
  const getMessagesList = (peerId: string) => Promise.resolve([] as Message[])
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  let err: Error

  err = await t.throwsAsync(addMessage('', 'test'))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(addMessage('NOT A PEER ID', 'test'))
  t.is(err.message, 'invalid peer ID')
})

test('should validate passed text', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const peers = Substitute.for<PeersApi>()
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesPath = (peerId: string) => ''
  const getMessagesList = (peerId: string) => Promise.resolve([] as Message[])
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  const err = await t.throwsAsync(addMessage(fakePeerId(), ''))

  t.is(err.message, 'invalid message text')
})

test('should add a message for a peer', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()
  const text = hat()
  let messages = [fakeMessage()]

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  ipfs.id().returns(Promise.resolve({ id: fakePeerId() }))
  
  files.write(getMessagesPath(peerId), Arg.any(), Arg.any())
    .mimicks(async (path: string, data: Buffer) => {
      messages = JSON.parse(data.toString())
    })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve(null))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesList = async () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
    syndicate,
    getMessagesPath,
    getMessagesList,
    friendsMessageHistorySize
  })

  await addMessage(peerId, text)

  files.received().write(getMessagesPath(peerId), Arg.any(), Arg.any())

  t.is(messages.length, 1) // Only the last message per peer is retained
  t.deepEqual(messages[0].text, text)
})

test('should add a message for a friend', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()
  const text = hat()
  const message = fakeMessage()
  let messages = [message]

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  ipfs.id().returns(Promise.resolve({ id: fakePeerId() }))

  files.write(getMessagesPath(peerId), Arg.any(), Arg.any())
    .mimicks(async (path: string, data: Buffer) => {
      messages = JSON.parse(data.toString())
    })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve({
    id: peerId,
    isFriend: true
  }))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesList = async () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
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
  const peerId = fakePeerId()
  const text = hat()
  let messages = [fakeMessage()]

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  ipfs.id().returns(Promise.resolve({ id: fakePeerId() }))

  files.write(getMessagesPath(peerId), Arg.any(), Arg.any())
    .mimicks(async (path: string, data: Buffer) => {
      messages = JSON.parse(data.toString())
    })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve({
    id: peerId,
    isFriend: true
  }))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesList = async () => messages
  const friendsMessageHistorySize = 1

  const addMessage = AddMessage({
    ipfs,
    peers,
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
  const peerId = fakePeerId()
  const text = hat()
  const message = fakeMessage()
  let messages = [message]

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  ipfs.id().returns(Promise.resolve({ id: peerId }))

  files.write(getMessagesPath(peerId), Arg.any(), Arg.any())
    .mimicks(async (path: string, data: Buffer) => {
      messages = JSON.parse(data.toString())
    })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve({
    id: peerId,
    isFriend: true
  }))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesList = async () => messages
  const friendsMessageHistorySize = 1000

  const addMessage = AddMessage({
    ipfs,
    peers,
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
