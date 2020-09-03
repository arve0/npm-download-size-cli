#!/usr/bin/env node
const https = require('https')
const fs = require('fs')

let spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let interval = setInterval(() => {
  let c = spinners.shift()
  process.stdout.write('\b')  // backspace
  process.stdout.write(c)
  spinners.push(c)
}, 100)

main()

async function main () {
  const { argv } = process;
  if (argv.length < 3 || argv[2] === '--help') {
    console.log('Usage: download-size package-name [another-package ...]')
  } else {
    let total = 0;
    for (let i = 2; i < argv.length; i++) {
      if (argv[i] === '-f' || argv[i] === '--file') {
        // The next arg must be a path to a package.json file
        const pkgJSONPath = argv[++i]

        try {
          const pkgJSON = fs.readFileSync(pkgJSONPath, {encoding: 'utf8'})
          const { dependencies, devDependencies } = JSON.parse(pkgJSON)

          const deps = transformDepsObjToArray(dependencies)
          const devDeps = transformDepsObjToArray(devDependencies)

          console.log(`"${pkgJSONPath}" dependencies:`)
          if (!deps.length) console.log('None')
          else {
            for (const dep of deps) {
              total += await getPackageSize(dep)
            }
          }

          console.log(`"${pkgJSONPath}" devDependencies:`)
          if (!devDeps.length) console.log("None")
          else {
            for (const devDep of devDeps) {
              total += await getPackageSize(devDep)
            }
          }
          console.log() // newline
        } catch (err) {
          console.error('' + err)
        }
      }
      else {
        total += await getPackageSize(argv[i])
        // Log newline if this is the last arg
        // or the next arg is -f or --file
        const j = i+1
        if (j === argv.length || argv[j] === '-f' || argv[j] === '--file') {
          console.log()
        }
      }
    }
    console.log(`Total size: ${total} bytes`)
  }
  clearInterval(interval)
}

/**
 * Transform a dependency obj like `{"autopefixer": "^9.8.6", ...}`
 * into an array `["autoprefixer@^9.8.6", ...]`
 */
function transformDepsObjToArray (deps) {
  if (!deps) return []
  return Object.entries(deps).map(([pkgName, version]) => `${pkgName}@${version}`)
}

/**
 * Get the size of a package and log it
 * @return the size of the package
 */
async function getPackageSize(pkgName) {
  let size = 0
  try {
    let result = await request(pkgName)
    size = result.size
    process.stdout.write('\b')  // backspace
    console.log(`${result.name}@${result.version}: ${result.prettySize}`)
  } catch (err) {
    console.error('' + err)
  }
  return size
}

function request (pkgName) {
  const options = {
    hostname: 'npm-download-size.seljebu.no',
    path: '/' + encodeURIComponent(pkgName),
    method: 'GET'
  }
  const req = https.request(options)
  req.end()

  return new Promise((resolve, reject) => {
    req.on('response', (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })

      response.on('end', () => {
        if (response.statusCode !== 200) {
          // use error message from server
          reject(new Error(`${body}`))
          return
        }
        resolve(JSON.parse(body))
      })
    })
  })
}
