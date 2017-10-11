#!/usr/bin/env node
const path = require('path')
const store = require('node-persist')
const pacote = require('pacote')
const request = require('./request')
const url = require('url')
const prefix = require('si-prefix')
const dots = require('cli-spinners').dots.frames
let prevSpin = Date.now() - 1000
spin()

store.initSync({
  dir: path.join(__dirname, '.cache')
})

if (process.argv.length !== 3 || process.argv[2] === '--help') {
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

async function resolve (pkgName, version, resolved = {}) {
  spin()
  version = version || 'latest'
  let manifest = await pacote.manifest(`${pkgName}@${version}`)

  let depVer = `${pkgName}@${manifest.version}`
  if (depVer in resolved) {
    return resolved
  }
  resolved[depVer] = manifest._resolved

  let pending = []
  let deps = manifest.dependencies || {}
  for (let dep in deps) {
    pending.push(resolve(dep, deps[dep], resolved))
  }
  await Promise.all(pending)
  return resolved
}

async function getSize (pkgName) {
  let resolved = await resolve(pkgName)

  let size = 0
  for (let pkg in resolved) {
    let pkgSize = await getTarballSize(resolved[pkg])
    // console.log(pkg.split('@').join('\t'), '\t', pkgSize)
    size += pkgSize
  }

  return size
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
  let output = converted[0].toFixed(2) + ' ' + converted[1]
  console.log(output)
  return output
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
