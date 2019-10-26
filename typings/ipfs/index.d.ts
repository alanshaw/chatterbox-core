declare module 'ipfs' {
  type PubSubHandler = (msg: PubSubMessage) => void

  export type CoreApi = {
    id: () => Promise<{ id: string }>,
    files: {
      read: (path: string) => Promise<Buffer>,
      write: (path: string, data: Buffer, options?: { truncate?: boolean, create?: boolean, parents?: boolean }) => Promise<void>,
      ls: (path: string) => Promise<Array<{ name: string }>>,
      rm: (path: string, options?: { recursive?: boolean }) => Promise<void>
    },
    pubsub: {
      publish: (topic: string, data: Buffer) => Promise<void>
      subscribe: (topic: string, handler: PubSubHandler, options?: { onError: (err: Error, fatal: boolean) => void }) => Promise<void>
      unsubscribe: (topic: string, handler?: PubSubHandler) => Promise<void>
    }
  }

  export type PubSubMessage = {
    seqno: Buffer
    from: string
    data: Buffer
  }
}
