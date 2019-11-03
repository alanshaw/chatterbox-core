import debug from 'debug'
import { PushableV } from 'it-pushable'

const log = debug('chatterbox-core:lib:syndicate')

export default class Syndicate<K> {
  private feeds: PushableV<K>[] = []

  join (source: PushableV<K>) {
    this.feeds.push(source)
  }

  leave (source: PushableV<K>) {
    this.feeds = this.feeds.filter(s => s !== source)
  }

  publish (diff: K) {
    log(diff)
    this.feeds.forEach(feed => feed.push(diff))
  }
}
