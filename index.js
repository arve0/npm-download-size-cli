#!/usr/bin/env node
const zlib = require('zlib')
const https = require('https')
const store = require('node-persist')
const pickManifest = require('npm-pick-manifest')
const url = require('url')
const plimit = require('p-limit')
const prefix = require('si-prefix')
const validatePkgName = require('validate-npm-package-name')

store.initSync()

if (process.argv.length !== 3) {
  console.log('Usage: download-size package-name')
  console.log('Clear cache: download-size --clear-cache')
} else if (process.argv[2] === '--clear-cache') {
  store.clearSync()
} else {
  getSize(process.argv[2])
    .then(prettyPrint)
    .catch(err => {
      console.error('' + err)
      process.exit(1)
    })
}

function prettyPrint (size) {
  let converted = prefix.byte.convert(size)
  console.log(converted[0].toFixed(2) + ' ' + converted[1])
}

function getFromCache (pkgName, checkForUpdates) {
  return new Promise((resolve, reject) => {
    let cache = store.getItemSync(pkgName)
    if (cache === undefined) {
      return reject(new Error('Not found in cache'))
    }
    if (!checkForUpdates) {
      return resolve(cache)
    }
    // check if it's been updated
    const headReq = https.request({
      host: 'registry.npmjs.org',
      path: '/' + pkgName,
      method: 'HEAD'
    })
    headReq.on('response', (response) => {
      if (response.headers['last-modified'] === cache['_last-modified']) {
        resolve(cache)
      } else {
        reject(new Error('Cache outdated'))
      }
    })
    headReq.end()
  })
}

function getFromRegistry (pkgName) {
  return new Promise((resolve, reject) => {
    const request = https.get({
      host: 'registry.npmjs.org',
      path: '/' + pkgName,
      headers: { 'Accept-Encoding': 'gzip' }
    })

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Got code ${response.statusCode} for ${pkgName}`))
      } else if (response.headers['content-encoding'] !== 'gzip') {
        return reject(new Error(`Did not get gzipped content from registry for package ${pkgName}.`))
      }

      let readable = response.pipe(zlib.createGunzip())
      let str = ''
      readable.setEncoding('utf8')
      readable.on('data', (chunk) => {
        str += chunk
      })

      readable.on('end', () => {
        let obj = JSON.parse(str)
        obj['_last-modified'] = response.headers['last-modified']
        store.setItemSync(pkgName, obj)
        resolve(obj)
      })
    })
  })
}

function getTarballSize (tarballUrl) {
  return new Promise((resolve, reject) => {
    let { hostname, path } = url.parse(tarballUrl)
    const headReq = https.request({
      hostname,
      path,
      method: 'HEAD'
    })
    headReq.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Got code ${response.statusCode} for ${tarballUrl}`))
      } else if (response.headers['content-length']) {
        let size = parseInt(response.headers['content-length'])
        if (typeof size !== 'number' || !isFinite(size)) {
          return reject(new Error(`Unable to parse content-length ${response.headers['content-length']} of ${tarballUrl}`))
        }
        resolve(size)
      } else {
        reject(new Error(`Did not get content length for ${tarballUrl}`))
      }
    })
    headReq.end()
  })
}

let pending = {}

async function getSize (pkgName, version) {
  if (!validPkgName(pkgName)) {
    throw new Error(`${pkgName} is not a valid package name`)
  }
  let registry = await getFromCache(pkgName, version === undefined)
    .catch(() => getFromRegistry(pkgName))

  version = version || registry['dist-tags'].latest
  let manifest = pickManifest(registry, version)
  if (manifest._size) {
    return manifest._size
  }

  let deps = manifest.dependencies || {}
  let size = 0
  let limit = plimit(10)
  let depSizes = Object.keys(deps).map(dep =>
    limit(() => {
      let depVer = dep + deps[dep]
      if (!pending[depVer]) {
        pending[depVer] = getSize(dep, deps[dep])
      }
      return pending[depVer]
    })
  )
  size += await Promise.all(depSizes)
    .then(sizes => sizes.reduce((sum, s) => sum + s, 0))

  size += await getTarballSize(manifest.dist.tarball)
  manifest._size = size
  store.setItemSync(pkgName, registry)

  return size
}

function validPkgName (pkgName) {
  let res = validatePkgName(pkgName)
  return res.validForNewPackages || res.validForOldPackages
}
