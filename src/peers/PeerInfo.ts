import { Message } from '../messages/Message'

export type PeerInfo = {
  id: string
  name?: string
  avatar?: string
  lastSeenAt?: number
  lastMessage?: Message
  isFriend?: boolean
}
