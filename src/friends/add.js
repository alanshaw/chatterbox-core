const Validate = require('./validate')

module.exports = ({ peers, getFriendsList, setFriendsList, syndicate }) => {
  return async (peerId, details) => {
    Validate.peerId(peerId)

    const friends = await getFriendsList()

    await peers.set(peerId, details)

    if (friends.includes(peerId)) return

    friends.push(peerId)

    await setFriendsList(friends)

    syndicate.publish({ action: 'add', id: peerId })
  }
}