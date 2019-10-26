declare module 'abortable-iterator' {
  export class AbortError extends Error {
    type: string
    code: String
  }

  function abortable<T> (source: AsyncIterable<T>, signal?: AbortSignal): AsyncIterable<T>

  export default abortable
}
