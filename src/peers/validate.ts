import { MessageData } from '../messages/MessageData'

export { peerId } from '../lib/validate'

export function name (name: string) {
  if (!name.trim()) {
    throw new Error('invalid name')
  }
}

export function avatar (avatar: string) {
  if (!avatar.trim()) {
    throw new Error('invalid avatar')
  }
}

export function lastSeenAt (lastSeenAt: number) {
  if (lastSeenAt <= 0) {
    throw new Error('invalid last seen time')
  }
}

export function lastMessage (msg: MessageData) {
  if (!msg.id) {
    throw new Error('invalid message ID')
  }

  if (!msg.text.trim()) {
    throw new Error('invalid message text')
  }

  if (msg.receivedAt <= 0) {
    throw new Error('invalid message received time')
  }

  if (msg.readAt != null && msg.readAt <= 0) {
    throw new Error('invalid message read time')
  }
}

export function isFriend (isFriend: boolean) {
  if (isFriend !== true && isFriend !== false) {
    throw new Error('invalid friend flag')
  }
}
