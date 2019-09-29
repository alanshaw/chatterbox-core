import test from 'ava'
import hat from 'hat'
import SetPeerInfo from '../../../src/peers/set-peer-info'

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
