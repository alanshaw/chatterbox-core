import test from 'ava'
import hat from 'hat'
import { fakePeerId } from '../../_helpers'
import GetPeerInfo from '../../../src/peers/get-peer-info'
import Substitute from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import { PeerInfo } from '../../../src/peers/PeerInfo'

test('should validate a passed peer ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const getPeerInfoPath = (peerId: string) => `/test/${peerId}/info.json`
  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  let err: Error

  err = await t.throwsAsync(getPeerInfo(''))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(getPeerInfo('NOT A PEER ID'))
  t.is(err.message, 'invalid peer ID')
})

test('should retrieve and parse data from correct path', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = (peerId: string) => `${repoDir}/${peerId}/info.json`
  const peerInfo: PeerInfo = {
    id: fakePeerId(),
    name: hat(),
    avatar: hat(),
    lastSeenAt: Date.now(),
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: Date.now()
    },
    isFriend: false
  }

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getPeerInfoPath(peerId)).mimicks(async () => Buffer.from(JSON.stringify(peerInfo)))

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const peer = await getPeerInfo(peerId)

  t.deepEqual(peer, peerInfo)
})

test('should return null when peer does not exist', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = (peerId: string) => `${repoDir}/${peerId}/info.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getPeerInfoPath(peerId)).mimicks(async () => {
    throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
  })

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const peer = await getPeerInfo(peerId)

  t.is(peer, null)
})

test('should throw on read error', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = (peerId: string) => `${repoDir}/${peerId}/info.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getPeerInfoPath(peerId)).mimicks(async () => {
    throw new Error('boom')
  })

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const err = await t.throwsAsync(getPeerInfo(peerId))

  t.is(err.message, 'boom')
})
