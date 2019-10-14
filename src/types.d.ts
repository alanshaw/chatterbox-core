import { Buffer } from 'buffer'

interface Ipfs {
  id: () => Promise<{ id: string }>,
  files: {
    read: (path: string) => Promise<Buffer>
  }
}

declare module 'mortice' {
  export type Mortice = {
    readLock: () => Promise<() => void>,
    writeLock: () => Promise<() => void>
  }

  function mortice (name?: string): Mortice

  export default mortice
}

declare module 'it-pushable' {
  export type Pushable<T> = {
    push: (value: T) => void,
    end: (err?: Error) => void
  }

  type Options = {
    onEnd: (err?: Error) => void,
    writev?: boolean
  }

  function pushable<T> (options?: Options): Pushable<T>

  export default pushable
}
