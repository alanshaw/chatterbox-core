import test from 'ava'
import hat from 'hat'
import MutexManager from '../../../src/lib/mutex-manager'
import { fakePeerId } from '../../_helpers'
import GarbageCollect from '../../../src/peers/garbage-collect'
import { PeerInfoData } from '../../../src/peers/PeerInfoData'
import { PeerInfo } from '../../../src/peers/PeerInfo'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import Syndicate from '../../../src/lib/syndicate'
import { PeerInfoDiff } from '../../../src/peers/PeerInfoDiff'

const fakePeerInfo: (data?: PeerInfoData) => PeerInfo = (data = {}) => ({
  id: fakePeerId(),
  name: hat(),
  avatar: hat(),
  lastSeenAt: Date.now(),
  isFriend: false,
  lastMessage: {
    id: hat(),
    text: hat(),
    receivedAt: Date.now(),
    readAt: Date.now()
  },
  ...data
})

const overAnHourAgo = () => {
  const oneHourAgo = Date.now() - (1000 * 60 * 60)
  return oneHourAgo - Math.ceil(Math.random() * 100)
}

test('should collect peers last seen more than an hour ago', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = (peerId: string) => `${peersPath}/${peerId}`

  const safePeers = [fakePeerInfo(), fakePeerInfo(), fakePeerInfo()]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ lastSeenAt: overAnHourAgo() })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {} as { [peerPath: string]: PeerInfo })

  const getPeerInfo = async (peerId: string) => peersByPath[getPeerPath(peerId)]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => Object.values(peersByPath).map(v => ({ name: v.id })))
  files.rm(Arg.any()).mimicks(async path => { delete peersByPath[path] })

  const mutexManager = MutexManager()
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const gc = GarbageCollect({
    ipfs,
    mutexManager,
    peersPath,
    getPeerPath,
    getPeerInfo,
    syndicate
  })

  await gc()

  safePeers.forEach(p => t.true(Boolean(peersByPath[getPeerPath(p.id)])))
  garbagePeers.forEach(p => t.false(Boolean(peersByPath[getPeerPath(p.id)])))
})

test('should collect peers never last seen', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = (peerId: string) => `${peersPath}/${peerId}`

  const safePeers = [fakePeerInfo(), fakePeerInfo(), fakePeerInfo()]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: undefined }),
    fakePeerInfo({ lastSeenAt: undefined })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {} as { [peerPath: string]: PeerInfo })

  const getPeerInfo = async (peerId: string) => peersByPath[getPeerPath(peerId)]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => Object.values(peersByPath).map(v => ({ name: v.id })))
  files.rm(Arg.any()).mimicks(async path => { delete peersByPath[path] })

  const mutexManager = MutexManager()
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const gc = GarbageCollect({
    ipfs,
    mutexManager,
    peersPath,
    getPeerPath,
    getPeerInfo,
    syndicate
  })

  await gc()

  safePeers.forEach(p => t.true(Boolean(peersByPath[getPeerPath(p.id)])))
  garbagePeers.forEach(p => t.false(Boolean(peersByPath[getPeerPath(p.id)])))
})

test('should not collect friends', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = (peerId: string) => `${peersPath}/${peerId}`

  const safePeers = [
    fakePeerInfo({ isFriend: true, lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ isFriend: true, lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ isFriend: true, lastSeenAt: overAnHourAgo() })
  ]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ lastSeenAt: overAnHourAgo() })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {} as { [peerPath: string]: PeerInfo })

  const getPeerInfo = async (peerId: string) => peersByPath[getPeerPath(peerId)]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => Object.values(peersByPath).map(v => ({ name: v.id })))
  files.rm(Arg.any()).mimicks(async path => { delete peersByPath[path] })

  const mutexManager = MutexManager()
  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const gc = GarbageCollect({
    ipfs,
    mutexManager,
    peersPath,
    getPeerPath,
    getPeerInfo,
    syndicate
  })

  await gc()

  safePeers.forEach(p => t.true(Boolean(peersByPath[getPeerPath(p.id)])))
  garbagePeers.forEach(p => t.false(Boolean(peersByPath[getPeerPath(p.id)])))
})
