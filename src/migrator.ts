import debug from 'debug'
import { CoreApi } from 'ipfs'

const log = debug('chatterbox-core:migrator')

const VERSIONS = Object.freeze([
  '/chatterbox/repo/1.0.0'
])

type Deps = {
  ipfs: CoreApi,
  repoDir: string
}

export default ({ ipfs, repoDir }: Deps) => {
  const versionPath = `${repoDir}/version.json`

  const api = {
    toLatest: () => api.toVersion(VERSIONS[VERSIONS.length - 1]),

    async toVersion (version: string) {
      log('migrating to %s', version)

      let repoVersion
      try {
        const data = await ipfs.files.read(versionPath)
        repoVersion = JSON.parse(data.toString())
      } catch (err) {
        if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
          log('repo not exists')
        } else {
          throw err
        }
      }

      // TODO: migrations
      if (repoVersion && repoVersion !== version) {
        throw new Error(`failed to migrate ${repoVersion} to ${version}, no migration available`)
      }

      // Successful migration \o/
      await ipfs.files.write(versionPath, Buffer.from(JSON.stringify(version)), {
        create: true,
        parents: true,
        truncate: true
      })
    }
  }

  return api
}

export { VERSIONS }
