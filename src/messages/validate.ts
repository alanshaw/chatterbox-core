export { peerId } from '../lib/validate'

export function messageId (messageId: string) {
  if (!messageId) {
    throw new Error('invalid message ID')
  }
}

export function text (text: string) {
  if (!text.trim()) {
    throw new Error('invalid message text')
  }
}
