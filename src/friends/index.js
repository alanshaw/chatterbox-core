const AddFriend = require('./add-friend')
const RemoveFriend = require('./remove-friend')
const GetFriendsFeed = require('./get-friends-feed')

const Friends = ({ ipfs, mutexManager, peers, config }) => {
  const addFriend = AddFriend({ peers })
  const removeFriend = RemoveFriend({ peers })
  const getFriendsFeed = GetFriendsFeed({ peers })

  return {
    add: addFriend,
    remove: removeFriend,
    feed: getFriendsFeed
  }
}

module.exports = Friends
