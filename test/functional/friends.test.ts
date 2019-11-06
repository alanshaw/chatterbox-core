import test from 'ava'
import AbortController from 'abort-controller'
import { pause, fakePeerId } from '../_helpers'
import MutexManager from '../../src/lib/mutex-manager'
import Friends from '../../src/friends'
import Peers from '../../src/peers'
import Substitute, { Arg } from '@fluffy-spoon/substitute'
import { CoreApi } from 'ipfs'
import { PeerInfo } from '../../src/peers/PeerInfo'

test('should add and remove friends', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const mutexManager = MutexManager()

  const data: { [path: string]: Buffer } = {}

  const ipfs = Substitute.for<CoreApi>()
  const files = Substitute.for<typeof ipfs.files>()
  if (ipfs.files.returns) ipfs.files.returns(files)

  files.write(Arg.is(path => typeof path === 'string' && path.startsWith(repoDir)))
    .mimicks(async (path, d) => { data[path] = d })

  files.read(Arg.is(path => typeof path === 'string' && path.startsWith(repoDir)))
    .mimicks(async path => {
      if (!data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      return data[path]
    })

  files.ls(Arg.any()).mimicks(async () => Object.keys(data).map(k => ({ name: k })))

  const config = {
    peersPath,
    repoDir,
    topics: {
      broadcast: '/chatterbox/broadcast',
      beacon: '/chatterbox/beacon'
    },
    friendsMessageHistorySize: 1000,
    beaconInterval: 5 * 60 * 1000
  }
  const peers = Peers({ ipfs, mutexManager, config })
  const friends = Friends({ peers })

  const controller = new AbortController()

  const friend0 = fakePeerId()
  const friend1 = fakePeerId()
  const friend2 = fakePeerId()

  const [friendsList] = await Promise.all([
    (async () => {
      let friendsList: PeerInfo[] = []
      try {
        for await (const list of friends.feed({ signal: controller.signal })) {
          friendsList = list
        }
      } catch (err) {
        t.is(err.type, 'aborted')
      }
      return friendsList
    })(),
    (async () => {
      await friends.add(friend0)
      await pause(10)
      await friends.add(friend1)
      await friends.add(friend2)
      await pause(10)
      await friends.remove(friend1)
      await pause(10)
      await friends.remove(friend2)
      await pause(10)
      await friends.add(friend0)
      await friends.add(friend2)
      await pause(10)
      await friends.remove(friend1)
      controller.abort()
    })()
  ])

  t.deepEqual(friendsList.map(f => f.id), [friend0, friend2])
})
