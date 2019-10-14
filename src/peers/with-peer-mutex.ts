import { MutexManager } from '../lib/mutex-manager'

export default function withPeerMutex<T> (
  manager: MutexManager,
  fn: (peerId: string) => Promise<T>,
  type: 'readLock' | 'writeLock'
) {
  return async (peerId: string) => {
    const mutex = manager.getMutex(`/chatterbox/peers/${peerId}`)
    const release = await mutex[type]()
    try {
      const res = await fn(peerId)
      return res
    } finally {
      release()
    }
  }
}
