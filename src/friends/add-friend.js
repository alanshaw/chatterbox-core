module.exports = ({ peers }) => {
  return (peerId, details) => (
    peers.set(peerId, { ...(details || {}), isFriend: true })
  )
}
