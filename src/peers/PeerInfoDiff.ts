import { PeerInfo } from './PeerInfo'

export type PeerInfoDiff = {
  action: 'add' | 'change',
  peerId: string,
  peerInfo: PeerInfo
} | {
  action: 'remove'
  peerId: string
}
