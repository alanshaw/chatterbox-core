import debug from 'debug'
import { Pushable } from 'it-pushable'

const log = debug('chatterbox-core:lib:syndicate')

export default class Syndicate<K> {
  private feeds: Pushable<K[], K>[] = []

  join (source: Pushable<K[], K>) {
    this.feeds.push(source)
  }

  leave (source: Pushable<K[], K>) {
    this.feeds = this.feeds.filter(s => s !== source)
  }

  publish (diff: K) {
    log(diff)
    this.feeds.forEach(feed => feed.push(diff))
  }
}
