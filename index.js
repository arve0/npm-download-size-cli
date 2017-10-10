#!/usr/bin/env node
const store = require('node-persist')
const pickManifest = require('npm-pick-manifest')
const request = require('./request')
const url = require('url')
const prefix = require('si-prefix')
const dots = require('cli-spinners').dots.frames
let prevSpin = Date.now() - 1000
spin()

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

let pending = {}
async function resolve (pkgName, version, resolved = {}) {
  spin()
  let packument = await getPackument(pkgName, version === undefined)
  version = version || packument['dist-tags'].latest
  let manifest = pickManifest(packument, version)

  let depVer = `${pkgName}@${manifest.version}`
  if (depVer in resolved) {
    return resolved
  }
  resolved[depVer] = manifest.dist.tarball

  let deps = manifest.dependencies || {}
  for (let dep in deps) {
    spin()
    resolved = await resolve(dep, deps[dep], resolved)
  }
  return resolved
}

async function getSize (pkgName) {
  let resolved = await resolve(pkgName)

  let size = 0
  for (let pkg in resolved) {
    size += await getTarballSize(resolved[pkg])
  }

  return size
}

async function getPackument (pkgName, checkForUpdates) {
  let packument = await store.getItem(pkgName)
  if (packument === undefined) {
    return getFromRegistry(pkgName)
  }
  if (!checkForUpdates) {
    return packument
  }
  // check if it's been updated
  let response = await request.head({
    host: 'registry.npmjs.org',
    path: '/' + pkgName,
    method: 'HEAD'
  })
  if (response.headers['last-modified'] !== packument['_last-modified']) {
    return getFromRegistry(pkgName)
  }
  return packument
}

async function getFromRegistry (pkgName) {
  const packument = await request.get({
    host: 'registry.npmjs.org',
    path: '/' + pkgName
  })
  store.setItemSync(pkgName, packument)
  return packument
}

async function getTarballSize (tarballUrl) {
  let size = await store.getItem(tarballUrl)
  if (typeof size === 'number') {
    return size
  }
  let { hostname, path } = url.parse(tarballUrl)
  const response = await request.head({
    hostname,
    path
  })

  if (!response.headers['content-length']) {
    throw new Error(`Did not get content length for ${tarballUrl}`)
  }

  size = parseInt(response.headers['content-length'])
  if (typeof size !== 'number' || !isFinite(size)) {
    throw new Error(`Unable to parse content-length ${response.headers['content-length']} of ${tarballUrl}`)
  }
  store.setItem(tarballUrl, size)
  return size
}

function prettyPrint (size) {
  let converted = prefix.byte.convert(size)
  process.stdout.write('\b') // remove spinner
  console.log(converted[0].toFixed(2) + ' ' + converted[1])
}

function spin () {
  if ((Date.now() - prevSpin) < 100) {
    return
  }
  prevSpin = Date.now()
  let c = dots.shift()
  dots.push(c)
  process.stdout.write('\b')
  process.stdout.write(c)
}
