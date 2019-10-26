declare module 'it-keepalive' {
  export default function keepAlive<T> (
    getKeepAliveValue: () => T,
    options?: { shouldKeepAlive?: () => boolean }
  ): (source: AsyncIterable<T>) => AsyncIterable<T>
}
