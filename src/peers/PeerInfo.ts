import { Message } from '../messages/message'

export type PeerInfo = {
  id: string
  name?: string
  avatar?: string
  lastSeenAt?: number
  lastMessage?: Message
  isFriend: boolean
}
