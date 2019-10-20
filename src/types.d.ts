interface Ipfs {
  id: () => Promise<{ id: string }>,
  files: {
    read: (path: string) => Promise<Buffer>,
    write: (path: string, data: Buffer, options?: { truncate?: boolean, create?: boolean, parents?: boolean }) => Promise<void>,
    ls: (path: string) => Promise<Array<{ name: string }>>,
    rm: (path: string, options?: { recursive?: boolean }) => Promise<void>
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
  export interface Pushable<T, TPush = T> extends AsyncIterable<T> {
    push: (value: TPush) => void,
    end: (err?: Error) => void
  }

  type Options = {
    onEnd?: (err?: Error) => void,
    writev?: boolean
  }

  function pushable<T, TPush = T> (options?: Options): Pushable<T, TPush>

  export default pushable
}

declare module 'abortable-iterator' {
  export class AbortError extends Error {
    type: string
    code: String
  }

  function abortable<T> (source: AsyncIterable<T>, signal?: AbortSignal): AsyncIterable<T>

  export default abortable
}

declare module 'it-pipe' {
  function pipe<A, R> (
    first: AsyncIterable<A> | (() => AsyncIterable<A>),
    last: (source: AsyncIterable<A>) => R
  ): R

  function pipe<A, B, R> (
    first: AsyncIterable<A> | (() => AsyncIterable<A>),
    second: (source: AsyncIterable<A>) => AsyncIterable<B>,
    last: (source: AsyncIterable<B>) => R,
  ): R

  export default pipe
}

declare module 'it-keepalive' {
  export default function keepAlive<T> (
    getKeepAliveValue: () => T,
    options?: { shouldKeepAlive?: () => boolean }
  ): (source: AsyncIterable<T>) => AsyncIterable<T>
}
