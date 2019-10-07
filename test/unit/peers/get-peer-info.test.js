import test from 'ava'
import hat from 'hat'
import { fakePeerId } from '../../_helpers'
import GetPeerInfo from '../../../src/peers/get-peer-info'

test('should validate a passed peer ID', async t => {
  const getPeerInfo = GetPeerInfo({ ipfs: {}, getPeerInfoPath: () => {} })

  let err

  err = await t.throwsAsync(getPeerInfo(null))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(getPeerInfo('NOT A PEER ID'))
  t.is(err.message, 'invalid peer ID')
})

test('should retrieve and parse data from correct path', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = peerId => `${repoDir}/${peerId}/info.json`
  const peerInfo = {
    id: fakePeerId(),
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
        t.is(path, getPeerInfoPath(peerId))
        return Buffer.from(JSON.stringify(peerInfo))
      }
    }
  }

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const peer = await getPeerInfo(peerId)

  t.deepEqual(peer, peerInfo)
})

test('should return null when peer does not exist', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = peerId => `${repoDir}/${peerId}/info.json`

  const ipfs = {
    files: {
      read: path => {
        throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      }
    }
  }

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const peer = await getPeerInfo(peerId)

  t.is(peer, null)
})

test('should throw on read error', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getPeerInfoPath = peerId => `${repoDir}/${peerId}/info.json`

  const ipfs = {
    files: {
      read: path => {
        throw new Error('boom')
      }
    }
  }

  const getPeerInfo = GetPeerInfo({ ipfs, getPeerInfoPath })

  const err = await t.throwsAsync(getPeerInfo(peerId))

  t.is(err.message, 'boom')
})
