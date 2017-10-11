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

let cache = path.join(process.env.APPDATA || process.env.HOME, '.npm', '_cacache')

store.initSync({
  dir: path.join(__dirname, '.cache')
})

async function main () {
  if (process.argv.length < 3 || process.argv[2] === '--help') {
    console.log('Usage: download-size package-name')
    console.log('Clear cache: download-size --clear-cache')
  } else if (process.argv[2] === '--clear-cache') {
    store.clearSync()
  } else {
    for (let i = 2; i < process.argv.length; i++) {
      let result = await getSize(process.argv[i])
      console.log(`${result.name}: ${result.size}`)
    }
  }
}
main().catch((err) => {
  console.error('' + err)
  process.exit(1)
})

async function resolve (pkgName, version, resolved = {}) {
  version = version || 'latest'
  let manifest = await pacote.manifest(`${pkgName}@${version}`, { cache })
  spin()

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

  return { depVer, pkgs: resolved }
}

async function getSize (pkgName) {
  let resolved = await resolve(pkgName)

  let pending = []
  for (let pkg in resolved.pkgs) {
    pending.push(getTarballSize(resolved.pkgs[pkg]))
  }
  let sizes = await Promise.all(pending)

  return {
    name: resolved.depVer,
    size: prettyPrint(sum(sizes))
  }
}

function sum (arr) {
  return arr.reduce((s, i) => s + i, 0)
}

async function getTarballSize (tarballUrl) {
  let size = await store.getItem(tarballUrl)
  spin()

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
