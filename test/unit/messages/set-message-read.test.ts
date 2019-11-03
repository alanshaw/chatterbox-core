import test from 'ava'
import hat from 'hat'
import { CoreApi } from 'ipfs'
import { fakePeerId } from '../../_helpers'
import SetMessageRead from '../../../src/messages/set-message-read'
import { Message } from '../../../src/messages/message'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import Syndicate from '../../../src/lib/syndicate'
import { MessageDiff } from '../../../src/messages/MessageDiff'
import { PeersApi } from '../../../src/peers'
import { PeerInfo } from '../../../src/peers/PeerInfo'

const fakeMessage = () => ({ id: hat(), text: hat(), receivedAt: Date.now() })

test('should validate passed peer ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const peers = Substitute.for<PeersApi>()
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = async (peerId: string) => [] as Message[]

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: 1000
  })

  let err

  err = await t.throwsAsync(setMessageRead('', hat()))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(setMessageRead('NOT A PEER ID', hat()))
  t.is(err.message, 'invalid peer ID')
})

test('should validate passed message ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const peers = Substitute.for<PeersApi>()
  const syndicate = Substitute.for<Syndicate<MessageDiff>>()
  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = async (peerId: string) => [] as Message[]

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: 1000
  })

  const err = await t.throwsAsync(setMessageRead(fakePeerId(), ''))

  t.is(err.message, 'invalid message ID')
})

test('should set message read time', async t => {
  const peerId = fakePeerId()
  let messages: Message[] = [fakeMessage()]
  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = async () => messages

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(getMessagesPath(peerId), Arg.any()).mimicks(async (_, data) => { messages = JSON.parse(data.toString()) })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve({
    id: peerId,
    lastMessage: { id: hat(), text: hat(), receivedAt: Date.now() },
    isFriend: false
  }))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: 1000
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, messages[0].id)

  t.true(messages[0].readAt && messages[0].readAt <= Date.now())
})

test('should not set message read time if not exists', async t => {
  const peerId = fakePeerId()
  let messages: Message[] = [fakeMessage()]
  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = async () => messages

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(getMessagesPath(peerId), Arg.any()).mimicks(async (_, data) => { messages = JSON.parse(data.toString()) })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve({
    id: peerId,
    lastMessage: { id: hat(), text: hat(), receivedAt: Date.now() },
    isFriend: false
  }))

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: 1000
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, hat())

  t.falsy(messages[0].readAt)
})

test('should set last message read time', async t => {
  const peerId = fakePeerId()
  const message = fakeMessage()
  let messages: Message[] = [{ ...message }]
  const peerInfo: PeerInfo = {
    id: peerId,
    lastMessage: { ...message },
    isFriend: false
  }

  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = async () => messages

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(getMessagesPath(peerId), Arg.any()).mimicks(async (_, data) => { messages = JSON.parse(data.toString()) })

  const peers = Substitute.for<PeersApi>()
  const peersUnsafe = Substitute.for<typeof peers.__unsafe__>()
  if (peers.__unsafe__.returns) peers.__unsafe__.returns(peersUnsafe)

  peersUnsafe.get(peerId).returns(Promise.resolve(peerInfo))

  peersUnsafe.set(peerId, Arg.any()).mimicks(async (id, { lastMessage }) => {
    if (lastMessage) peerInfo.lastMessage = lastMessage
  })

  const syndicate = Substitute.for<Syndicate<MessageDiff>>()

  const setMessageRead = SetMessageRead({
    ipfs,
    peers,
    getMessagesList,
    getMessagesPath,
    syndicate,
    friendsMessageHistorySize: 1000
  })

  t.falsy(messages[0].readAt)

  await setMessageRead(peerId, messages[0].id)

  t.true(messages[0].readAt && messages[0].readAt <= Date.now())
  t.truthy(peerInfo.lastMessage)

  if (peerInfo.lastMessage) {
    t.is(peerInfo.lastMessage.readAt, messages[0].readAt)
  }
})
