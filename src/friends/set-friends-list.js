const { Buffer } = require('buffer')

module.exports = ({ ipfs, friendsPath }) => {
  return friends => {
    const data = Buffer.from(JSON.stringify(friends))
    return ipfs.files.write(friendsPath, data, {
      create: true,
      parents: true
    })
  }
}
