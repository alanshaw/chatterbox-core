exports.peerId = peerId => {
  if (typeof peerId !== 'string' || !peerId) {
    throw new Error('invalid peer ID')
  }
}
