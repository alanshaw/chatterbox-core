import { MutexManager } from "../lib/mutex-manager"
import { ChatterboxConfig } from "../ChatterboxConfig"
import AddFriend from './add-friend'
import RemoveFriend from './remove-friend'
import GetFriendsFeed from './get-friends-feed'
import { PeersApi } from "../peers"

type Deps = {
  peers: PeersApi
}

const Friends = ({ peers }: Deps) => ({
  add: AddFriend({ peers }),
  remove: RemoveFriend({ peers }),
  feed: GetFriendsFeed({ peers })
})

export default Friends
