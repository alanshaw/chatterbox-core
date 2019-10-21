import * as Validate from './validate'
import { PROTOCOL_VERSION } from './constants'
import AddMessage from './add-message'

type Deps = {
  ipfs: Ipfs,
  addMessage: ReturnType<typeof AddMessage>
  broadcastTopic: string
}

export default ({ ipfs, addMessage, broadcastTopic }: Deps) => {
  return async (text: string) => {
    Validate.text(text)
    text = text.trim()
    const { id } = await ipfs.id()
    await addMessage(id, text)
    const data = Buffer.from(JSON.stringify({ version: PROTOCOL_VERSION, text }))
    await ipfs.pubsub.publish(broadcastTopic, data)
  }
}
