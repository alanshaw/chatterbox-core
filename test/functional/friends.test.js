import test from 'ava'
import AbortController from 'abort-controller'
import { pause, fakePeerId } from '../_helpers'
import MutexManager from '../../src/lib/mutex-manager'
import Friends from '../../src/friends'
import Peers from '../../src/peers'

test('should add and remove friends', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const peersPath = `${repoDir}/peers`
  const mutexManager = MutexManager()

  const ipfs = {
    _data: {},
    files: {
      ls: path => Object.keys(ipfs._data).map(k => ({ name: k })),
      stat: path => {
        if (!ipfs._data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
      },
      read: path => {
        t.true(path.startsWith(repoDir))
        if (!ipfs._data[path]) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
        return ipfs._data[path]
      },
      write: (path, data) => {
        t.true(path.startsWith(repoDir))
        ipfs._data[path] = data
      }
    }
  }

  const peers = await Peers({ ipfs, mutexManager, config: { peersPath } })
  const friends = await Friends({ ipfs, mutexManager, peers, config: { repoDir } })

  const controller = new AbortController()

  const friend0 = fakePeerId()
  const friend1 = fakePeerId()
  const friend2 = fakePeerId()

  const [friendsList] = await Promise.all([
    (async () => {
      let friendsList = []
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
