import test from 'ava'
import hat from 'hat'
import { fakePeerId } from '../../_helpers'
import SetPeerInfo from '../../../src/peers/set-peer-info'
import { PeerInfoData } from '../../../src/peers/PeerInfoData'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import { PeerInfoDiff } from '../../../src/peers/PeerInfoDiff'
import Syndicate from '../../../src/lib/syndicate'

const fakePeerInfoData = (): PeerInfoData => ({
  name: hat(),
  avatar: hat(),
  lastSeenAt: Date.now(),
  isFriend: false,
  lastMessage: {
    id: hat(),
    text: hat(),
    receivedAt: Date.now(),
    readAt: Date.now()
  }
})

test('should validate passed peer ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const getPeerInfoPath = (_: string) => ''
  const getPeerInfo = async (_: string) => null
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  let err: Error

  err = await t.throwsAsync(setPeerInfo('', fakePeerInfoData()))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(setPeerInfo('NOT A PEER ID', fakePeerInfoData()))
  t.is(err.message, 'invalid peer ID')
})

test('should validate passed details', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const getPeerInfoPath = (_: string) => ''
  const getPeerInfo = async (_: string) => null
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  let err
  err = await t.throwsAsync(setPeerInfo(fakePeerId(), { name: '' }))
  t.is(err.message, 'invalid name')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), { avatar: '' }))
  t.is(err.message, 'invalid avatar')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), { lastSeenAt: -3 }))
  t.is(err.message, 'invalid last seen time')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), { lastMessage: null } as any))
  t.is(err.message, 'invalid message')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), {
    lastMessage: {
      id: null
    } as any
  }))
  t.is(err.message, 'invalid message ID')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), {
    lastMessage: {
      id: hat(),
      text: 12345
    } as any
  }))
  t.is(err.message, 'invalid message text')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), {
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: 'INVALID'
    } as any
  }))
  t.is(err.message, 'invalid message received time')

  err = await t.throwsAsync(setPeerInfo(fakePeerId(), {
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: Date.now(),
      readAt: 'INVALID'
    } as any
  }))
  t.is(err.message, 'invalid message read time')
})

test('should add peer info', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peerId = fakePeerId()
  const data: { [path: string]: Buffer } = {}

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(Arg.any()).mimicks(async (path, d) => { data[path] = d })

  const getPeerInfoPath = (peerId: string) => `${repoDir}/peers/${peerId}/info.json`
  const getPeerInfo = async () => null
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  const details = fakePeerInfoData()

  await setPeerInfo(peerId, details)

  const peerInfo = JSON.parse(data[getPeerInfoPath(peerId)].toString())

  t.is(peerInfo.id, peerId)
  t.deepEqual(peerInfo, { id: peerId, ...details })
})

test('should update peer info', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peerId = fakePeerId()
  const peerInfo = { id: peerId, ...fakePeerInfoData() }
  const data = { [peerId]: Buffer.from(JSON.stringify(peerInfo)) }

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(Arg.any()).mimicks(async (path, d) => { data[path] = d })

  const getPeerInfoPath = (peerId: string) => `${repoDir}/peers/${peerId}/info.json`
  const getPeerInfo = async () => peerInfo
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  const details = fakePeerInfoData()

  await setPeerInfo(peerId, details)

  const updatedPeerInfo = JSON.parse(data[getPeerInfoPath(peerId)].toString())

  t.is(updatedPeerInfo.id, peerId)
  t.deepEqual(updatedPeerInfo, { id: peerId, ...details })
})
