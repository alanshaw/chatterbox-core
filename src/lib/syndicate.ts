import debug from 'debug'
import { Pushable } from 'it-pushable'

const log = debug('chatterbox-core:lib:syndicate')

export type Diff<T> = {
  action: 'add' | 'change',
  id: string,
  data: T
} | {
  action: 'remove'
  id: string
}

export default class Syndicate<K> {
  private feeds: Pushable<Diff<K>[], Diff<K>>[] = []

  join (source: Pushable<Diff<K>[], Diff<K>>) {
    this.feeds.push(source)
  }

  leave (source: Pushable<Diff<K>[], Diff<K>>) {
    this.feeds = this.feeds.filter(s => s !== source)
  }

  publish (diff: Diff<K>) {
    log(diff)
    this.feeds.forEach(feed => feed.push(diff))
  }
}
