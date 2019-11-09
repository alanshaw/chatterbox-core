import mortice, { Mortice } from 'mortice'

export type MutexManager = {
  getMutex: (key: string) => Mortice
}

export default (): MutexManager => {
  const lockers = new Map<string, Mortice>()
  return {
    getMutex (key) {
      let mutex = lockers.get(key)
      if (!mutex) {
        mutex = mortice(key)
        lockers.set(key, mutex)
      }
      return mutex
    }
  }
}
