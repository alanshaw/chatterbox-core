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

const overAnHourAgo = () => {
  const oneHourAgo = Date.now() - (1000 * 60 * 60)
  return oneHourAgo - Math.ceil(Math.random() * 100)
}

test('should collect peers last seen more than an hour ago', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = peerId => `${peersPath}/${peerId}`

  const safePeers = [fakePeerInfo(), fakePeerInfo(), fakePeerInfo()]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ lastSeenAt: overAnHourAgo() })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {})

  const getPeerInfo = peerId => peersByPath[getPeerPath(peerId)]

  const ipfs = {
    id: () => ({ id: fakePeerId() }),
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

test('should collect peers never last seen', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = peerId => `${peersPath}/${peerId}`

  const safePeers = [fakePeerInfo(), fakePeerInfo(), fakePeerInfo()]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: null }),
    fakePeerInfo({ lastSeenAt: null })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {})

  const getPeerInfo = peerId => peersByPath[getPeerPath(peerId)]

  const ipfs = {
    id: () => ({ id: fakePeerId() }),
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

test('should not collect friends', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = peerId => `${peersPath}/${peerId}`

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
  }, {})

  const getPeerInfo = peerId => peersByPath[getPeerPath(peerId)]

  const ipfs = {
    id: () => ({ id: fakePeerId() }),
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

test('should not collect self', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const getPeerPath = peerId => `${peersPath}/${peerId}`
  const peerId = fakePeerId()

  const safePeers = [
    fakePeerInfo({ id: peerId, lastSeenAt: overAnHourAgo() })
  ]
  const garbagePeers = [
    fakePeerInfo({ lastSeenAt: overAnHourAgo() }),
    fakePeerInfo({ lastSeenAt: overAnHourAgo() })
  ]

  const peersByPath = [...safePeers, ...garbagePeers].reduce((data, p) => {
    data[getPeerPath(p.id)] = p
    return data
  }, {})

  const getPeerInfo = peerId => peersByPath[getPeerPath(peerId)]

  const ipfs = {
    id: () => ({ id: peerId }),
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
