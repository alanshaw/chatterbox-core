import test from 'ava'
import hat from 'hat'
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

test('should garbage collect with default filter', t => {
  
})
