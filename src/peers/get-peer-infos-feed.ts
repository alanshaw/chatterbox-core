import Syndicate, { Diff } from "../lib/syndicate"
import { PeerInfo } from "./PeerInfo"
import abortable, { AbortError } from 'abortable-iterator'
import pushable from 'it-pushable'
import map from 'p-map'
import pipe from 'it-pipe'
import keepAlive from 'it-keepalive'
import debug from 'debug'
import clone from 'clone-deep'

const log = debug('chatterbox-core:messages:feed')
const Yes = (peerInfo: PeerInfo) => true

type Deps = {
  ipfs: Ipfs,
  peersPath: string,
  getPeerInfo: (peerId: string) => Promise<PeerInfo | null>,
  syndicate: Syndicate<PeerInfo>
}

type Options = {
  filter?: (peerInfo: PeerInfo) => boolean,
  signal?: AbortSignal
}

export default ({ ipfs, peersPath, getPeerInfo, syndicate }: Deps) => {
  return (options: Options) => {
    options = options || {}

    const filter = options.filter || Yes

    return (async function * () {
      if (options.signal && options.signal.aborted) throw new AbortError()

      // Stash the pushable for the feed so that any updates
      // that happen while yielding local peer cache are also yielded
      const source = pushable<Diff<PeerInfo>[], Diff<PeerInfo>>({ writev: true })
      syndicate.join(source)

      try {
        let peers: PeerInfo[]

        const updater = (source: AsyncIterable<Diff<PeerInfo>[]>) => (async function * () {
          // Yield local peer cache first
          let files: { name: string }[]
          try {
            files = await ipfs.files.ls(peersPath)
          } catch (err) {
            if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
              files = []
            } else {
              throw err
            }
          }

          peers = (await map(files, f => getPeerInfo(f.name), { concurrency: 8 }))
            .reduce<PeerInfo[]>((infos, peerInfo) => peerInfo ? infos.concat(peerInfo) : infos, [])
            .filter(filter)

          yield clone(peers)

          for await (const diffs of source) {
            peers = diffs
              .reduce((peers, diff) => {
                if (diff.action === 'add') {
                  return peers.concat(diff.data)
                } else if (diff.action === 'change') {
                  const index = peers.findIndex(p => p.id === diff.id)
                  if (index === -1) return peers.concat(diff.data)
                  peers[index] = diff.data
                  return peers
                } else if (diff.action === 'remove') {
                  return peers.filter(p => p.id !== diff.id)
                }
                log(`unknown action: "${diff.action}"`)
                return peers
              }, peers)
              .filter(filter)

            yield clone(peers)
          }
        })()

        yield * pipe<Diff<PeerInfo>[], PeerInfo[], AsyncIterable<PeerInfo[]>>(
          options.signal ? abortable<Diff<PeerInfo>[]>(source, options.signal) : source,
          updater,
          keepAlive<PeerInfo[]>(() => clone(peers), {
            shouldKeepAlive () {
              const filteredPeers = peers.filter(filter)
              if (filteredPeers.length === peers.length) return false
              peers = filteredPeers
              return true
            }
          })
        )
      } finally {
        syndicate.leave(source)
      }
    })()
  }
}
