import { MessageData } from '../messages/MessageData'

export type PeerInfoData = {
  name?: string
  avatar?: string
  lastSeenAt?: number
  lastMessage?: MessageData
  isFriend?: boolean
}
