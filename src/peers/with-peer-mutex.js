module.exports = (manager, fn, type) => {
  return async (...args) => {
    const mutex = manager.getMutex(`/chatterbox/peers/${args[0]}`)
    const release = await mutex[type]()
    try {
      const res = await fn(...args)
      return res
    } finally {
      release()
    }
  }
}
