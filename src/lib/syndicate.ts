import debug from 'debug'
import { Pushable } from 'it-pushable'

const log = debug('chatterbox-core:lib:syndicate')

type Diff<T> = {
  action: 'add' | 'remove' | 'change',
  id: string,
  data: T
}

export default <K>() => {
  let feeds: Pushable<Diff<K>>[] = []
  return {
    join: (source: Pushable<Diff<K>>) => feeds.push(source),
    leave: (source: Pushable<Diff<K>>) => { feeds = feeds.filter(s => s !== source) },
    publish: (diff: Diff<K>) => {
      log(diff)
      feeds.forEach(feed => feed.push(diff))
    }
  }
}
