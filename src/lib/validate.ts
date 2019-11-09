const Base58RegExp = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/

export function peerId (peerId: string) {
  if (typeof peerId !== 'string' || !Base58RegExp.test(peerId)) {
    throw new Error('invalid peer ID')
  }
}
