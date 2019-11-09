declare module 'mortice' {
  export type Mortice = {
    readLock: () => Promise<() => void>,
    writeLock: () => Promise<() => void>
  }

  function mortice (name?: string): Mortice

  export default mortice
}
