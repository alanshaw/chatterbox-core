import { MessageData } from '../messages/MessageData'

export { peerId } from '../lib/validate'

export function name (name: string) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('invalid name')
  }
}

export function avatar (avatar: string) {
  if (typeof avatar !== 'string' || !avatar.trim()) {
    throw new Error('invalid avatar')
  }
}

export function lastSeenAt (lastSeenAt: number) {
  if (!Number.isInteger(lastSeenAt) || lastSeenAt <= 0) {
    throw new Error('invalid last seen time')
  }
}

export function lastMessage (msg: MessageData) {
  if (!msg) {
    throw new Error('invalid message')
  }

  if (typeof msg.id !== 'string') {
    throw new Error('invalid message ID')
  }

  if (typeof msg.text !== 'string' || !msg.text.trim()) {
    throw new Error('invalid message text')
  }

  if (!Number.isInteger(msg.receivedAt) || msg.receivedAt <= 0) {
    throw new Error('invalid message received time')
  }

  if (msg.readAt != null && (!Number.isInteger(msg.readAt) || msg.readAt <= 0)) {
    throw new Error('invalid message read time')
  }
}

export function isFriend (isFriend: boolean) {
  if (isFriend !== true && isFriend !== false) {
    throw new Error('invalid friend flag')
  }
}
