import test from 'ava'
import hat from 'hat'
import SetPeerInfo from '../../../src/peers/set-peer-info'

const fakePeerInfoDetails = () => ({
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
  const ipfs = {}
  const getPeerInfoPath = () => {}
  const getPeerInfo = () => {}
  const syndicate = {}

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  const err = await t.throwsAsync(setPeerInfo(null))

  t.is(err.message, 'invalid peer ID')
})

test('should validate passed details', async t => {
  const ipfs = {}
  const getPeerInfoPath = () => {}
  const getPeerInfo = () => {}
  const syndicate = {}

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  let err
  err = await t.throwsAsync(setPeerInfo(hat(), { name: '' }))
  t.is(err.message, 'invalid name')

  err = await t.throwsAsync(setPeerInfo(hat(), { avatar: '' }))
  t.is(err.message, 'invalid avatar')

  err = await t.throwsAsync(setPeerInfo(hat(), { lastSeenAt: {} }))
  t.is(err.message, 'invalid last seen time')

  err = await t.throwsAsync(setPeerInfo(hat(), { lastMessage: null }))
  t.is(err.message, 'invalid message')

  err = await t.throwsAsync(setPeerInfo(hat(), {
    lastMessage: {
      id: null
    }
  }))
  t.is(err.message, 'invalid message ID')

  err = await t.throwsAsync(setPeerInfo(hat(), {
    lastMessage: {
      id: hat(),
      text: 12345
    }
  }))
  t.is(err.message, 'invalid message text')

  err = await t.throwsAsync(setPeerInfo(hat(), {
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: 'INVALID'
    }
  }))
  t.is(err.message, 'invalid message received time')

  err = await t.throwsAsync(setPeerInfo(hat(), {
    lastMessage: {
      id: hat(),
      text: hat(),
      receivedAt: Date.now(),
      readAt: 'INVALID'
    }
  }))
  t.is(err.message, 'invalid message read time')
})

test('should add peer info', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peerId = hat()

  const ipfs = {
    _data: {},
    files: {
      stat: () => {
        throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      },
      write: (path, data) => {
        ipfs._data[path] = data
      }
    }
  }
  const getPeerInfoPath = peerId => `${repoDir}/peers/${peerId}/info.json`
  const getPeerInfo = () => null
  const syndicate = { publish: () => {} }

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  const details = fakePeerInfoDetails()

  await setPeerInfo(peerId, details)

  const peerInfo = JSON.parse(ipfs._data[getPeerInfoPath(peerId)])

  t.is(peerInfo.id, peerId)
  t.deepEqual(peerInfo, { id: peerId, ...details })
})

test('should update peer info', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peerId = hat()
  const peerInfo = { id: peerId, ...fakePeerInfoDetails() }

  const ipfs = {
    _data: {
      [peerId]: Buffer.from(JSON.stringify(peerInfo))
    },
    files: {
      stat: () => {},
      write: (path, data) => {
        ipfs._data[path] = data
      }
    }
  }
  const getPeerInfoPath = peerId => `${repoDir}/peers/${peerId}/info.json`
  const getPeerInfo = () => peerInfo
  const syndicate = { publish: () => {} }

  const setPeerInfo = SetPeerInfo({
    ipfs,
    getPeerInfoPath,
    getPeerInfo,
    syndicate
  })

  const details = fakePeerInfoDetails()

  await setPeerInfo(peerId, details)

  const updatedPeerInfo = JSON.parse(ipfs._data[getPeerInfoPath(peerId)])

  t.is(updatedPeerInfo.id, peerId)
  t.deepEqual(updatedPeerInfo, { id: peerId, ...details })
})
