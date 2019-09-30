const { Buffer } = require('buffer')
const log = require('debug')('chatterbox-core:beacon')

const PROTOCOL_VERSION = '1.0.0'

module.exports = async ({ ipfs, peers, peer, config }) => {
  const onBeaconMessage = async msg => {
    const id = msg.seqno.toString('hex')
    const peerId = msg.from

    const { id: nodeId } = await ipfs.id()
    if (peerId === nodeId) return

    let beaconMsg
    try {
      beaconMsg = JSON.parse(msg.data)
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
