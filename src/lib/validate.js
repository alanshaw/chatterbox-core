const Base58RegExp = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/

exports.peerId = peerId => {
  if (typeof peerId !== 'string' || !peerId || !Base58RegExp.test(peerId)) {
    throw new Error('invalid peer ID')
  }
}
