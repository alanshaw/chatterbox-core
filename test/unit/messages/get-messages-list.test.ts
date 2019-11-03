import test from 'ava'
import hat from 'hat'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { fakePeerId } from '../../_helpers'
import GetMessagesList from '../../../src/messages/get-messages-list'
import { CoreApi } from 'ipfs'

test('should validate a passed peer ID', async t => {
  const ipfs = Substitute.for<CoreApi>()
  const getMessagesPath = (peerId: string) => `/test/${peerId}/messages.json`
  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })
  let err: Error

  err = await t.throwsAsync(getMessagesList(''))
  t.is(err.message, 'invalid peer ID')

  err = await t.throwsAsync(getMessagesList('NOT A PEER ID'))
  t.is(err.message, 'invalid peer ID')
})

test('should retrieve and parse data from correct path', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`
  const messagesList = [{
    id: hat(),
    text: hat(),
    receivedAt: Date.now()
  }]

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getMessagesPath(peerId)).returns(Promise.resolve(Buffer.from(JSON.stringify(messagesList))))

  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })

  const list = await getMessagesList(peerId)

  t.deepEqual(list, messagesList)
})

test('should return empty array when messages file does not exist', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getMessagesPath(peerId)).returns(Promise.reject(Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })))

  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })

  const list = await getMessagesList(peerId)

  t.deepEqual(list, [])
})

test('should throw on read error', async t => {
  const repoDir = `/${Date.now()}`
  const peerId = fakePeerId()

  const getMessagesPath = (peerId: string) => `${repoDir}/${peerId}/messages.json`

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.read(getMessagesPath(peerId)).returns(Promise.reject(new Error('boom')))

  const getMessagesList = GetMessagesList({ ipfs, getMessagesPath })

  const err = await t.throwsAsync(getMessagesList(peerId))

  t.is(err.message, 'boom')
})
