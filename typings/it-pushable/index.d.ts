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
