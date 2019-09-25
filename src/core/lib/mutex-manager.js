const mortice = require('mortice')

module.exports = () => {
  const lockers = {}
  return {
    getMutex (key) {
      lockers[key] = lockers[key] || mortice(key)
      return lockers[key]
    }
  }
}
