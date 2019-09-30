const VERSIONS = Object.freeze([
  '/chatterbox/repo/1.0.0'
])

module.exports = ({ ipfs, repoDir }) => {
  const versionPath = `${repoDir}/version.json`

  const api = {
    toLatest: () => api.toVersion(VERSIONS[VERSIONS.length - 1]),

    async toVersion (version) {
      let repoVersion
      try {
        const data = await ipfs.files.read(versionPath)
        repoVersion = JSON.parse(data)
      } catch (err) {
        if (err.code === 'ERR_NOT_FOUND' || err.message.includes('does not exist')) {
          // No repo created yet
        } else {
          throw err
        }
      }

      // TODO: migrations
      if (repoVersion && repoVersion !== version) {
        throw new Error(`failed to migrate ${repoVersion} to ${version}, no migration available`)
      }

      // Successful migration \o/
      await ipfs.files.write(versionPath, JSON.stringify(version), {
        create: true,
        parents: true
      })
    }
  }

  return api
}

module.exports.VERSIONS = VERSIONS
