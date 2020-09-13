#!/usr/bin/env node
const https = require('https')
const fs = require('fs')
const siPrefix = require('si-prefix')

let spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
let interval = setInterval(() => {
  let c = spinners.shift()
  process.stdout.write('\b')  // backspace
  process.stdout.write(c)
  spinners.push(c)
}, 100)

main().catch(err => {
  eraseSpinner()
  console.log('' + err)
}).then(() => {
  clearInterval(interval)
})

async function main() {
  const { argv } = process;
  if (argv.length < 3 || argv[2] === '--help') {
    console.log('Usage: ')
    console.log('  download-size package-name [another-package ...]')
    console.log('  download-size -f package.json [another-package ...]')
  } else {
    let packagesAndOrFiles = parseArgumentsToPackages(argv.slice(2))

    let total = 0;
    for (let packageOrFile of packagesAndOrFiles) {
      if (packageOrFile.filename) {
        let fileTotal = 0
        eraseSpinner()
        console.log(`${packageOrFile.filename} (${packageOrFile.name}):`)

        async function printDependenciesAndAddToTotal(key) {
          if (packageOrFile[key].length) {
            console.log(`  ${key}:`)
          }
          for (let dependency of packageOrFile[key]) {
            try {
              let result = await request(dependency)
              fileTotal += result.size
              total += result.size
              printPackageSize(result, '    ')
            } catch (err) {
              eraseSpinner()
              console.log('' + err)
            }
          }
        }

        await printDependenciesAndAddToTotal('dependencies')
        await printDependenciesAndAddToTotal('devDependencies')
        console.log(`All dependencies: ${pretty(fileTotal)}\n`)
      } else {
        try {
          let result = await request(packageOrFile.name)
          total += result.size
          printPackageSize(result, '')
        } catch (err) {
          eraseSpinner()
          console.log('' + err)
        }
      }
    }

    if (hasMultiplePackages(packagesAndOrFiles)) {
      console.log(`\nAll packages: ${pretty(total)}`)
    }
  }
}

/**
 * Parse arguments into:
 * [
 *  {
 *    name: string
 *  },
 *  {
 *    name: string,
 *    filename: string,
 *    dependencies: string[],
 *    devDependencies: string[],
 *  },
 * ]
 */
function parseArgumentsToPackages(args) {
  const packages = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--file') {
      i += 1 // jump past -f option

      const filename = args[i]
      if (filename === undefined) {
        throw new Error(`Expected filename after ${args[i - 1]}`)
      }

      try {
        const pkg = JSON.parse(
          fs.readFileSync(filename, { encoding: 'utf8' })
        )
        const name = `${pkg.name}@${pkg.version}`
        const dependencies = transformDepsObjToArray(pkg.dependencies)
        const devDependencies = transformDepsObjToArray(pkg.devDependencies)

        packages.push({ name, filename, dependencies, devDependencies })
      } catch (err) {
        throw new Error(`Unable to read file '${filename}': ${err}`)
      }
    } else {
      packages.push({ name: args[i] })
    }
  }

  packages.sort((a, b) => {
    if (a.filename && !b.filename) {
      return -1
    } else if (!a.filename && b.filename) {
      return 1
    } else if (a.filename && b.filename) {
      return nameCompare(a.filename, b.filename)
    }
    return nameCompare(a.name, b.name)
  })

  return packages
}

function nameCompare(a, b) {
  if (a < b) {
    return -1
  } else if (a > b) {
    return 1
  } else {
    return 0
  }
}

/**
 * Transform a dependency obj like `{"autopefixer": "^9.8.6", ...}`
 * into an array `["autoprefixer@^9.8.6", ...]`
 */
function transformDepsObjToArray (deps) {
  if (!deps) return []
  return Object.entries(deps).map(([pkgName, version]) => `${pkgName}@${version}`)
}

function printPackageSize(pkg, prefix) {
  eraseSpinner()
  console.log(`${prefix}${pkg.name}@${pkg.version}: ${pkg.prettySize}`)
}

function eraseSpinner() {
  process.stdout.write('\b')  // backspace
}

// see https://npm-download-size.seljebu.no
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

function pretty (size) {
  let [prettySize, postFix] = siPrefix.byte.convert(size)
  return prettySize.toFixed(2) + ' ' + postFix
}

function hasMultiplePackages(packages) {
  const numberOfPackages = packages.reduce((length, pkg) =>
    pkg.filename
      ? length + pkg.dependencies.length + pkg.devDependencies.length
      : length + 1
  , 0)

  return numberOfPackages > 1
}
