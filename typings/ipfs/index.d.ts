declare module 'ipfs' {
  interface FilesApi {
    ls: (path: string) => Promise<Array<{ name: string }>>
    read: (path: string) => Promise<Buffer>
    rm: (path: string, options?: { recursive?: boolean }) => Promise<void>
    write: (path: string, data: Buffer, options?: { truncate?: boolean, create?: boolean, parents?: boolean }) => Promise<void>
  }

  interface PubSubApi {
    publish: (topic: string, data: Buffer) => Promise<void>
    subscribe: (topic: string, handler: PubSubHandler, options?: { onError: (err: Error, fatal: boolean) => void }) => Promise<void>
    unsubscribe: (topic: string, handler?: PubSubHandler) => Promise<void>
  }

  export type PubSubHandler = (msg: PubSubMessage) => void

  interface Multiaddr {}

  interface SwarmApi {
    localAddrs: () => Promise<Multiaddr[]>
    connect: (addr: Multiaddr) => Promise<void>
  }

  export interface CoreApi {
    id: () => Promise<{ id: string }>
    files: FilesApi
    pubsub: PubSubApi,
    swarm: SwarmApi,
    stop: () => Promise<void>
  }

  export interface PubSubMessage {
    seqno: Buffer
    from: string
    data: Buffer
  }

  class IPFS {
    static create: (options: any) => CoreApi
  }

  export default IPFS
}
