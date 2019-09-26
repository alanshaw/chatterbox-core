# Chatterbox Core

[![Build Status](https://travis-ci.org/alanshaw/chatterbox-core.svg?branch=master)](https://travis-ci.org/alanshaw/chatterbox-core)
[![dependencies Status](https://david-dm.org/alanshaw/chatterbox-core/status.svg)](https://david-dm.org/alanshaw/chatterbox-core)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> The core API for Chatterbox, a messaging application built on IPFS and libp2p.

## Install

```sh
npm install chatterbox-core
```

## Usage

```js
const Chatterbox = require('chatterbox-core')
```

## API

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
* [cbox.peer](#cboxpeer)
    * [cbox.peer.get](#cboxpeerget)
    * [cbox.peer.set](#cboxpeersetdetails)
* [cbox.peers](#cboxpeers)
    * [cbox.peers.feed](#cboxpeersfeedoptions)
    * [cbox.peers.gc](#cboxpeersgcoptions)
    * [cbox.peers.get](#cboxpeersgetpeerid)
    * [cbox.peers.set](#cboxpeerssetpeerid-details)

### Constructor

To create a new chatterbox core instance, await on a call to the factory function that is the default export for the module. Note a "ready" IPFS instance is _required_ with pubsub _enabled_.

```js
const Chatterbox = require('chatterbox-core')
const cbox = await Chatterbox(ipfs, [options])
```

* `ipfs: IPFS`
* `options: Object`
    * `repoDir: String` (default `/.chatterbox`)
    * `topics: Object`
        * `broadcast: String` (default `/chatterbox/broadcast/1.0.0`)
        * `beacon: String` (default `/chatterbox/beacon/1.0.0`)
    * `friendsMessageHistorySize: Number` (default `1000`)

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


### `cbox.peer`

#### `cbox.peer.get()`

Get the local peer's info.

* `id: String`
* `name: String`
* `avatar: String`
* `lastSeenAt: Number`
* `lastMessage: Object`
    * `text: String`
    * `receivedAt: Number`
    * `readAt: Number`

Returns `Promise<Object>`

#### `cbox.peer.set(details)`

Set the peer's info.

* `details: Object`
    * `name: String`
    * `avatar: String`

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


## MFS layout

```
/.chatterbox
├── friends.json  # Array of Peer IDs
├── peers
|   ├── QmPeer0
|   |   ├── info.json      # Peer info object
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

### `peers/Qm.../info.json`

Peer data.

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

### `peers/Qm.../messages.json`

Length limited messages received by a peer. Stored by `receivedAt` in ascending order.

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

## Ideas

1. Message index file `messages/index.json` and then per message file as id (`messages/[id].json`) or `receivedAt` time (`messages/1568883407737.json`).
2. ndjson messages file `messages.ndjson` for streaming

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/chatterbox-core/issues/new) or submit PRs.

## License

[MIT](LICENSE) © Alan Shaw
