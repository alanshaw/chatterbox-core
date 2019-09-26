exports.peerId = peerId => {
  if (typeof peerId !== 'string' || !peerId) {
    throw new Error('invalid peer ID')
  }
}

exports.messageId = messageId => {
  if (typeof messageId !== 'string' || !messageId) {
    throw new Error('invalid message ID')
  }
}

exports.text = text => {
  if (typeof text !== 'string' || !text) {
    throw new Error('invalid message text')
  }
}
