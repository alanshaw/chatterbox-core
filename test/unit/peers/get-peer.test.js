import test from 'ava'
import hat from 'hat'
import GetPeer from '../../../src/peers/get-peer'

test('should validate a passed peer ID', async t => {
  const getPeer = GetPeer({ ipfs: {}, getPeerPath: () => {} })
  const err = await t.throwsAsync(getPeer(null))
  t.is(err.message, 'invalid peer ID')
})

test('should retrieve and parse data from correct path', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()

  const getPeerPath = peerId => `${repoDir}/${peerId}/info.json`
  const peerInfo = {
    id: hat(),
    name: hat(),
    avatar: hat(),
    lastSeenAt: Date.now(),
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: Date.now()
    }
  }

  const ipfs = {
    files: {
      read: path => {
        t.is(path, getPeerPath(peerId))
        return Buffer.from(JSON.stringify(peerInfo))
      }
    }
  }

  const getPeer = GetPeer({ ipfs, getPeerPath })

  const peer = await getPeer(peerId)

  t.deepEqual(peer, peerInfo)
})

test('should return null when peer does not exist', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()

  const getPeerPath = peerId => `${repoDir}/${peerId}/info.json`

  const ipfs = {
    files: {
      read: path => {
        throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      }
    }
  }

  const getPeer = GetPeer({ ipfs, getPeerPath })

  const peer = await getPeer(peerId)

  t.is(peer, null)
})

test('should throw on read error', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = hat()

  const getPeerPath = peerId => `${repoDir}/${peerId}/info.json`

  const ipfs = {
    files: {
      read: path => {
        throw new Error('boom')
      }
    }
  }

  const getPeer = GetPeer({ ipfs, getPeerPath })

  const err = await t.throwsAsync(getPeer(peerId))

  t.is(err.message, 'boom')
})
