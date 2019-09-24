# IPFS Chatterbox

## MFS layout

```
/.chatterbox
├── friends.json  # Array of Peer IDs
├── peers
|   ├── QmPeer0
|   |   ├── profile.json   # Peer profile object
|   |   └── messages.json  # Array of received messages
|   ├── QmPeer1
|   └── QmPeer2
└── version.json  # Data store layout version
```

### `friends.json`

List of Peer IDs that the user has "made friends" with.

```json
[
  "QmFriend0",
  "QmFriend1",
  "QmFriend2"
]
```

### `profile.json`

Peer profile data. Note that user _is a_ peer so their info is stored here also.

```json
{
  "id": "QmPeerId",
  "name": "Dave",
  "avatar": "http://ipfs.io/ipfs/QmAvatar",
  "lastSeenAt": 1568883407737,
  "lastMessage": {
    "id": "HexMessageId",
    "text": "Hello World!",
    "receivedAt": 1568883407737,
    "readAt": 1568883407737
  }
}
```

### `messages.json`

Length limited messages received by a peer. Stored by `receivedAt` in descending order.

```json
[
  {
    "id": "HexMessageId",
    "text": "Hello World!",
    "receivedAt": 1568883407737,
    "readAt": 1568883407737
  }
]
```

## Core API

* [Constructor](#constructor)
* [cbox.friends](#cboxfriends)
    * [cbox.friends.add](#cboxfriendsaddpeerid-details)
    * [cbox.friends.feed](#cboxfriendsfeedoptions)
    * [cbox.friends.list](#cboxfriendslist)
    * [cbox.friends.remove](#cboxfriendsremovepeerid)
* [cbox.messages](#cboxmessages)
    * [cbox.messages.broadcast](#cboxmessagesbroadcasttext)
    * [cbox.messages.feed](#cboxmessagesfeedpeerid-options)
    * [cbox.messages.list](#cboxmessageslistpeerid)
    * [cbox.messages.read](#cboxmessagesreadpeerid-messageid)
* [cbox.peers](#cboxpeers)
    * [cbox.peers.feed](#cboxpeersfeedoptions)
    * [cbox.peers.gc](#cboxpeersgcoptions)
    * [cbox.peers.get](#cboxpeersgetpeerid)
    * [cbox.peers.set](#cboxpeerssetpeerid-details)
* [cbox.profile](#cboxprofile)
    * [cbox.profile.get](#cboxprofileget)
    * [cbox.profile.set](#cboxprofilesetdetails)

### Constructor

```js
const cbox = await chatterbox([options])
```

### `cbox.friends`

Manage friends.

#### `cbox.friends.add(peerId, [details])`

* `peerId: String`
* `details: Object`
    * `name: String`
    * `avatar: String`

Returns `Promise`

#### `cbox.friends.feed([options])`

Live updating friend list.

* `options: Object`
    * `signal: AbortSignal`

Returns `AsyncIterable<String[]>`

```js
for await (const friends of cbox.friends.feed())
  friends.forEach(peerId => console.log(peerId))
```

#### `cbox.friends.list()`

Get the current friends list.

Returns `Promise<String[]>`

#### `cbox.friends.remove(peerId)`

* `peerId: String`

Returns `Promise`


### `cbox.messages`

Manage messages received from peers.

#### `cbox.messages.broadcast(text)`

Send a message to all peers connected to the chatterbox network. Note: this is a temporary PoC API call!

* `text: String`

Returns `Promise`

#### `cbox.messages.feed(peerId, [options])`

Live updating list of messages for a given peer.

* `peerId: String`
* `options: Object`
    * `signal: AbortSignal`

Returns `AsyncIterable<Object[]>`

```js
for await (const list of cbox.messages.feed('Qm...'))
  list.forEach(msg => console.log(msg))
```

Each message:

* `id: String`
* `text: String`
* `receivedAt: Number`
* `readAt: Number`

#### `cbox.messages.list(peerId)`

Get the messages stored for a given peer.

Returns `Promise<Object[]>`

Each message:

* `id: String`
* `text: String`
* `receivedAt: Number`
* `readAt: Number`

#### `cbox.messages.read(peerId, messageId)`

Set the `readAt` field for a given message to the current time (if not already set).

* `peerId: String`
* `messageId: String`

Returns `Promise`


### `cbox.peers`

Information about peers in the chatterbox network.

#### `cbox.peers.feed([options])`

Live updating list of known peers in the chatterbox network.

* `options: Object`
    * `filter: Function`
    * `signal: AbortSignal`

Returns `AsyncIterable<Object[]>`

```js
for await (const list of cbox.peers.feed())
  list.forEach(peer => console.log(peerId))
```

Each peerId:

* `id: String`
* `name: String`
* `avatar: String`
* `lastSeenAt: Number`
* `lastMessage: Object`
    * `id: String`
    * `text: String`
    * `receivedAt: Number`
    * `readAt: Number`

#### `cbox.peers.gc([options])`

Clean up peers. Pass an optional filter function to avoid collecting friends.

* `options: Object`
    * `filter: Function`

Returns `Promise`

#### `cbox.peers.get(peerId)`

Get details stored for the passed Peer ID.

* `peerId: String`

Returns `Promise<Object>`

Peer details:

* `id: String`
* `name: String`
* `avatar: String`
* `lastSeenAt: Number`
* `lastMessage: Object`
    * `id: String`
    * `text: String`
    * `receivedAt: Number`
    * `readAt: Number`

#### `cbox.peers.set(peerId, details)`

Set properties for a peer.

* `peerId: String`
* `details: Object`
    * `name: String`
    * `avatar: String`
    * `lastMessage: Object`
        * `id: String`
        * `text: String`
        * `receivedAt: Number`
        * `readAt: Number`


### `cbox.profile`

#### `cbox.profile.get()`

Get the current user's profile.

* `id: String`
* `name: String`
* `avatar: String`
* `lastSeenAt: Number`
* `lastMessage: Object`
    * `text: String`
    * `receivedAt: Number`
    * `readAt: Number`

Returns `Promise<Object>`

#### `cbox.profile.set(details)`

Set the current user's profile properties.

* `details: Object`
    * `name: String`
    * `url: String`

Returns `Promise`
