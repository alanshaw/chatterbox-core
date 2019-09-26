import test from 'ava'
import hat from 'hat'
import AbortController from 'abort-controller'
import GetFriendsFeed from '../../../src/friends/get-friends-feed'

test('should yield when a friend is added', async t => {
  const diff = { action: 'add', id: hat() }

  const getFriendsList = () => []
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

  const getFriendsFeed = GetFriendsFeed({ getFriendsList, syndicate })
  const friendsFeed = getFriendsFeed()

  t.deepEqual((await friendsFeed.next()).value, [])
  t.deepEqual((await friendsFeed.next()).value, [diff.id])

  friendsFeed.return()
})

test('should yield when a friend is removed', async t => {
  const peerId = hat()
  const diff = { action: 'remove', id: peerId }

  const getFriendsList = () => [peerId]
  const syndicate = {
    join: source => setTimeout(() => source.push(diff), 10),
    leave: () => {}
  }

  const getFriendsFeed = GetFriendsFeed({ getFriendsList, syndicate })
  const friendsFeed = getFriendsFeed()

  t.deepEqual((await friendsFeed.next()).value, [peerId])
  t.deepEqual((await friendsFeed.next()).value, [])

  friendsFeed.return()
})

test('should be aborted by a signal', async t => {
  let interval

  const getFriendsList = () => []
  const syndicate = {
    join: source => {
      interval = setInterval(() => source.push({ action: 'add', id: hat() }), 10)
    },
    leave: () => {}
  }

  const getFriendsFeed = GetFriendsFeed({ getFriendsList, syndicate })
  const controller = new AbortController()
  const friendsFeed = getFriendsFeed({ signal: controller.signal })

  setTimeout(() => controller.abort(), 100)

  const err = await t.throwsAsync(async () => {
    for await (const friends of friendsFeed) { // eslint-disable-line no-unused-vars
      // noop
    }
  })

  t.is(err.type, 'aborted')
  clearInterval(interval)
})
