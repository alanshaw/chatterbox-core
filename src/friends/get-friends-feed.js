module.exports = ({ peers }) => {
  return options => {
    options = options || {}

    const filter = (...args) => {
      const info = args[0]

      if (info.isFriend) {
        return options.filter ? options.filter(...args) : true
      }

      return false
    }

    return peers.feed({ ...options, filter })
  }
}
