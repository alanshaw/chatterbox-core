const Validate = require('./validate')

module.exports = ({ getFriendsList, setFriendsList, syndicate }) => {
  return async peerId => {
    Validate.peerId(peerId)

    let friends = await getFriendsList()

    if (!friends.includes(peerId)) return

    friends = friends.filter(id => id !== peerId)

    await setFriendsList(friends)

    syndicate.publish({ action: 'remove', id: peerId })
  }
}
