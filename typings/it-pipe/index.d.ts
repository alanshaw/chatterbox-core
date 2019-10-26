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
