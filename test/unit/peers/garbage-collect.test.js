import test from 'ava'
import hat from 'hat'
import MutexManager from '../../../src/lib/mutex-manager'
import { fakePeerId } from '../../_helpers'
import GarbageCollect from '../../../src/peers/garbage-collect'

const fakePeerInfo = (data = {}) => ({
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

test('should collect peers last seen more than an hour ago', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const getPeerPath = peerId => `${peersPath}/${peerId}`
  const oneHourAgo = Date.now() - (1000 * 60 * 60)

  const safePeers = [fakePeerInfo(), fakePeerInfo(), fakePeerInfo()]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: oneHourAgo - Math.ceil(Math.random() * 100) }),
    fakePeerInfo({ lastSeenAt: oneHourAgo - Math.ceil(Math.random() * 100) })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {})

  const getPeerInfo = peerId => peersByPath[getPeerPath(peerId)]

  const ipfs = {
    files: {
      ls: () => Object.values(peersByPath).map(v => ({ name: v.id })),
      rm: path => { delete peersByPath[path] }
    }
  }
  const mutexManager = MutexManager()
  const syndicate = {
    publish: () => {}
  }

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
