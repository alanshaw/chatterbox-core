import shuffle from 'array-shuffle'

export function pause (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function fakePeerId () {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  return `Qm${shuffle(alphabet.split('')).slice(0, 44).join('')}`
}
