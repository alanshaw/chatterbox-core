module.exports = ({ peers }) => {
  return peerId => peers.set(peerId, { isFriend: false })
}
