import debug from 'debug'
import { CoreApi, PubSubMessage } from 'ipfs'
import { PeersApi } from './peers'
import { PeerApi } from './peer'
import { ChatterboxConfig } from './ChatterboxConfig'

const log = debug('chatterbox-core:beacon')

const PROTOCOL_VERSION = '1.0.0'

type Deps = {
  ipfs: CoreApi,
  peers: PeersApi,
  peer: PeerApi,
  config: ChatterboxConfig
}

type BeaconMessage = {
  version: string
  name?: string
  avatar?: string
}

export default async ({ ipfs, peers, peer, config }: Deps) => {
  const onBeaconMessage = async (msg: PubSubMessage) => {
    const id = msg.seqno.toString('hex')
    const peerId = msg.from

    const { id: nodeId } = await ipfs.id()
    if (peerId === nodeId) return

    let beaconMsg: BeaconMessage
    try {
      beaconMsg = JSON.parse(msg.data.toString())
    } catch (err) {
      return log('failed to parse %s from %s', id, peerId, msg.data, err)
    }

    log('received beacon message %s from %s', id, peerId, beaconMsg)

    // TODO: support semver?
    if (beaconMsg.version !== PROTOCOL_VERSION) {
      return log('incompatible beacon protocol version %s', beaconMsg.version)
    }

    try {
      await peers.set(peerId, {
        name: beaconMsg.name,
        avatar: beaconMsg.avatar,
        lastSeenAt: Date.now()
      })
    } catch (err) {
      return log('failed to update peer %s from %s', id, peerId, beaconMsg, err)
    }
  }

  const subscribeBeacon = () => (
    ipfs.pubsub.subscribe(config.topics.beacon, onBeaconMessage, {
      onError: (err, fatal) => {
        log('pubsub beacon subscription error', err)
        if (fatal) {
          setTimeout(async function resub () {
            try {
              await subscribeBeacon()
            } catch (err) {
              log('failed to resubscribe', err)
              setTimeout(resub, 1000)
            }
          }, 1000)
        }
      }
    })
  )

  await subscribeBeacon()

  const intervalId = setInterval(async () => {
    const { name, avatar } = await peer.get()
    const data = Buffer.from(JSON.stringify({ version: PROTOCOL_VERSION, name, avatar }))

    try {
      await ipfs.pubsub.publish(config.topics.beacon, data)
    } catch (err) {
      log('failed to publish beacon message', err)
    }
  }, config.beaconInterval)

  return {
    _destroy () {
      clearInterval(intervalId)
      return ipfs.pubsub.unsubscribe(config.topics.beacon, onBeaconMessage)
    }
  }
}
