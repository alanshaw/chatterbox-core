import { CoreApi } from 'ipfs'
import * as Validate from './validate'
import { PeerInfo } from './PeerInfo'

type Deps = {
  ipfs: CoreApi,
  getPeerInfoPath: (peerId: string) => string
}

export default ({ ipfs, getPeerInfoPath }: Deps) => {
  return async (peerId: string): Promise<PeerInfo | null> => {
    Validate.peerId(peerId)

    try {
      const data = await ipfs.files.read(getPeerInfoPath(peerId))
      return JSON.parse(data.toString())
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        return null
      }
      throw err
    }
  }
}
