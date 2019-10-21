import { Message } from './Message'

export type MessageDiff = {
  action: 'add' | 'change',
  peerId: string,
  messageId: string,
  message: Message
} | {
  action: 'remove'
  peerId: string,
  messageId: string
}
