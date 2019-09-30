import test from 'ava'
import IPFS from 'ipfs'
import Os from 'os'
import Path from 'path'
import Fs from 'fs'
import hat from 'hat'
import Chatterbox from '../../'

const tmpRepoDir = async () => {
  const dir = Path.join(Os.tmpdir(), `chatterbox-core-test-${hat()}`)
  await Fs.promises.mkdir(dir, { recursive: true })
  return dir
}

const connect = async nodes => {
  for (const node of nodes) {
    const dests = nodes.filter(n => n !== node)
    for (const dest of dests) {
      const addrs = await dest.swarm.localAddrs()
      await node.swarm.connect(addrs[0])
    }
  }
}

test.beforeEach(async t => {
  const repoDirs = [await tmpRepoDir(), await tmpRepoDir()]

  const nodes = await Promise.all(
    repoDirs.map(repo => IPFS.create({
      repo,
      config: {
        Bootstrap: [],
        Addresses: {
          Swarm: ['/ip4/127.0.0.1/tcp/0'],
          API: '/ip4/127.0.0.1/tcp/0',
          Gateway: '/ip4/127.0.0.1/tcp/0'
        }
      }
    }))
  )

  await connect(nodes)

  t.context.nodes = nodes
  t.context.repoDirs = repoDirs
})

test.afterEach.always(async t => {
  for (const node of t.context.nodes) {
    await node.stop()
  }

  for (const dir of t.context.repoDirs) {
    await Fs.promises.rmdir(dir, { recursive: true })
  }
})

test('should smoke test', async t => {
  const app0 = await Chatterbox(t.context.nodes[0], { beaconInterval: 1000 })
  const app1 = await Chatterbox(t.context.nodes[1])

  const name0 = hat()
  const name1 = hat()

  await app0.peer.set({ name: name0 })
  await app1.peer.set({ name: name1 })

  const peerInfo0 = await app0.peer.get()
  const peerInfo1 = await app1.peer.get()

  t.is(peerInfo0.name, name0)
  t.is(peerInfo1.name, name1)

  await Promise.all([
    (async () => {
      const message0 = hat()

      // Send from app0
      setTimeout(() => app0.messages.broadcast(message0))

      // Receive on app1
      for await (const messages of app1.messages.feed(peerInfo0.id)) {
        if (messages.length) {
          t.is(messages[0].text, message0)
          break
        }
      }
    })(),
    (async () => {
      // Peer name should be updated by beacon
      for await (const peers of app1.peers.feed()) {
        const app0PeerInfo = peers.find(p => p.id === peerInfo0.id)

        if (app0PeerInfo && app0PeerInfo.name === name0) {
          break
        }
      }
    })()
  ])

  await app0.destroy()
  await app1.destroy()
})
