export { peerId } from '../lib/validate'

export function messageId (messageId: string) {
  if (!messageId || typeof messageId !== 'string') {
    throw new Error('invalid message ID')
  }
}

export function text (text: string) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('invalid message text')
  }
}
