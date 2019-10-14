import Validate from './validate'

export default ({ ipfs, getPeerInfoPath }: {
  ipfs: Ipfs,
  getPeerInfoPath: (peerId: string) => string
}) => {
  return async (peerId: string): PeerInfo => {
    Validate.peerId(peerId)

    try {
      const data = await ipfs.files.read(getPeerInfoPath(peerId))
      return JSON.parse(data)
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        return null
      }
      throw err
    }
  }
}
