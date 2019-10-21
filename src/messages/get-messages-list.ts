import * as Validate from './validate'
import { Message } from './message'

type Deps = {
  ipfs: Ipfs
  getMessagesPath: (peerId: string) => string
}

export default ({ ipfs, getMessagesPath }: Deps) => {
  return async (peerId: string): Promise<Message[]> => {
    Validate.peerId(peerId)

    try {
      const data = await ipfs.files.read(getMessagesPath(peerId))
      return JSON.parse(data.toString())
    } catch (err) {
      if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
        return []
      }
      throw err
    }
  }
}
