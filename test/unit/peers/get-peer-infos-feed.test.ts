import test from 'ava'
import AbortController from 'abort-controller'
import { pause, fakePeerId } from '../../_helpers'
import GetPeerInfosFeed from '../../../src/peers/get-peer-infos-feed'
import { PeerInfo } from '../../../src/peers/PeerInfo'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import Syndicate from '../../../src/lib/syndicate'
import { PeerInfoDiff } from '../../../src/peers/PeerInfoDiff'
import { CoreApi } from 'ipfs'
import { AbortError } from 'abortable-iterator'

test('should yield when a peer is added', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo: PeerInfo = { id: fakePeerId() }
  const diff: PeerInfoDiff = { action: 'add', peerId: peerInfo.id, peerInfo }

  const getPeerInfo = async () => null

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => { throw Object.assign(new Error(), { code: 'ERR_NOT_FOUND' }) })

  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()
  syndicate.join(Arg.any()).mimicks(source => setTimeout(() => source.push(diff), 10))

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed()

  t.deepEqual((await feed.next()).value, [])
  t.deepEqual((await feed.next()).value, [peerInfo])

  feed.return()
})

test('should yield cached peers first', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo: PeerInfo = { id: fakePeerId() }
  const cache = { [peerInfo.id]: peerInfo }

  const getPeerInfo = async (peerId: string) => cache[peerId]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => Object.keys(cache).map(k => ({ name: k })))

  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed()

  t.deepEqual((await feed.next()).value, [peerInfo])

  feed.return()
})

test('should yield when a peer is removed', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo: PeerInfo = { id: fakePeerId() }
  const diff: PeerInfoDiff = { action: 'remove', peerId: peerInfo.id }

  const getPeerInfo = async () => peerInfo

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => [{ name: peerInfo.id }])

  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()
  syndicate.join(Arg.any()).mimicks(source => setTimeout(() => source.push(diff), 10))

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed()

  t.deepEqual((await feed.next()).value, [peerInfo])
  t.deepEqual((await feed.next()).value, [])

  feed.return()
})

test('should be aborted by a signal', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  let interval

  const getPeerInfo = async () => null

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => [])

  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()
  syndicate.join(Arg.any()).mimicks(source => {
    interval = setInterval(() => source.push({
      action: 'add',
      peerId: fakePeerId(),
      peerInfo: Substitute.for<PeerInfo>()
    }), 10)
  })

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const controller = new AbortController()
  const feed = getPeerInfosFeed({ signal: controller.signal })

  setTimeout(() => controller.abort(), 100)

  const err = await t.throwsAsync<AbortError>(async () => {
    for await (const peers of feed) { // eslint-disable-line no-unused-vars
      // noop
    }
  })

  t.is(err.type, 'aborted')
  clearInterval(interval)
})

test('should yield for time based filter', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo = { id: fakePeerId(), lastSeenAt: Date.now() }
  const cache = { [peerInfo.id]: peerInfo }

  const getPeerInfo = async (peerId: string) => cache[peerId]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.ls(Arg.any()).mimicks(async () => Object.keys(cache).map(k => ({ name: k })))

  const syndicate = Substitute.for<Syndicate<PeerInfoDiff>>()

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed({
    filter ({ lastSeenAt }) {
      return (lastSeenAt || 0) > Date.now() - 10
    }
  })

  t.deepEqual((await feed.next()).value, [peerInfo])
  pause(1500)
  t.deepEqual((await feed.next()).value, [])

  feed.return()
})
