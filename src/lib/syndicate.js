const log = require('debug')('chatterbox-core:lib:syndicate')

module.exports = () => {
  let feeds = []
  return {
    join: source => feeds.push(source),
    leave: source => { feeds = feeds.filter(s => s !== source) },
    publish: diff => {
      log(diff)
      feeds.forEach(feed => feed.push(diff))
    }
  }
}
