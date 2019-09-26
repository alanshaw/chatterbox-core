const mortice = require('mortice')

module.exports = () => {
  const lockers = new Map()
  return {
    getMutex (key) {
      if (lockers.has(key)) return lockers.get(key)
      lockers.set(key, mortice(key))
      return lockers.get(key)
    }
  }
}
