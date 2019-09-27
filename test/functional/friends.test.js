import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import pause from '../helpers/_pause'
import MutexManager from '../../src/lib/mutex-manager'
import Friends from '../../src/friends'

test('should add and remove friends', async t => {
  const repoDir = `/TEST-${Date.now()}`
  const mutexManager = MutexManager()

  const ipfs = {
    _data: null,
    files: {
      read: path => {
        t.true(path.startsWith(repoDir))
        if (!ipfs._data) throw Object.assign(new Error('not found'), { code: 'ERR_NOT_FOUND' })
        return ipfs._data
      },
      write: (path, data) => {
        t.true(path.startsWith(repoDir))
        ipfs._data = data
      }
    }
  }

  const peers = { set: () => {} }

  const friends = await Friends({ ipfs, mutexManager, peers, config: { repoDir } })
  const controller = new AbortController()

  const friend0 = hat()
  const friend1 = hat()
  const friend2 = hat()

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

  t.deepEqual(friendsList, [friend0, friend2])
})
