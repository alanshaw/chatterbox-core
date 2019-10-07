import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import { pause, fakePeerId } from '../../_helpers'
import GetPeerInfosFeed from '../../../src/peers/get-peer-infos-feed'

test('should yield when a peer is added', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo = { id: fakePeerId() }
  const diff = { action: 'add', id: peerInfo.id, peerInfo }

  const getPeerInfo = () => null
  const ipfs = {
    files: {
      ls: () => { throw Object.assign(new Error(), { code: 'ERR_NOT_FOUND' }) }
    }
  }
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed()

  t.deepEqual((await feed.next()).value, [])
  t.deepEqual((await feed.next()).value, [peerInfo])

  feed.return()
})

test('should yield cached peers first', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo = { id: fakePeerId() }
  const cache = { [peerInfo.id]: peerInfo }

  const getPeerInfo = peerId => cache[peerId]
  const ipfs = {
    files: {
      ls: () => Object.keys(cache).map(k => ({ name: k }))
    }
  }
  const syndicate = {
    join: () => {},
    leave: () => {}
  }

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed()

  t.deepEqual((await feed.next()).value, [peerInfo])

  feed.return()
})

test('should yield when a peer is removed', async t => {
  const repoDir = `/${Date.now()}`
  const peersPath = `${repoDir}/peers`

  const peerInfo = { id: fakePeerId() }
  const diff = { action: 'remove', id: peerInfo.id }

  const getPeerInfo = () => peerInfo
  const ipfs = {
    files: {
      ls: () => [{ name: peerInfo.id }]
    }
  }
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

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

  const getPeerInfo = () => null
  const ipfs = {
    files: {
      ls: () => []
    }
  }
  const syndicate = {
    join: source => {
      interval = setInterval(() => source.push({ action: 'add', id: fakePeerId() }), 10)
    },
    leave: () => {}
  }

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const controller = new AbortController()
  const feed = getPeerInfosFeed({ signal: controller.signal })

  setTimeout(() => controller.abort(), 100)

  const err = await t.throwsAsync(async () => {
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

  const getPeerInfo = peerId => cache[peerId]
  const ipfs = {
    files: {
      ls: () => Object.keys(cache).map(k => ({ name: k }))
    }
  }
  const syndicate = {
    join: () => {},
    leave: () => {}
  }

  const getPeerInfosFeed = GetPeerInfosFeed({ ipfs, peersPath, getPeerInfo, syndicate })
  const feed = getPeerInfosFeed({
    filter ({ lastSeenAt }) {
      return lastSeenAt > Date.now() - 10
    }
  })

  t.deepEqual((await feed.next()).value, [peerInfo])
  pause(1500)
  t.deepEqual((await feed.next()).value, [])

  feed.return()
})
