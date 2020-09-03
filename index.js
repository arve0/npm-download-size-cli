#!/usr/bin/env node
const https = require('https')

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
      try {
        let result = await request(argv[i])
        process.stdout.write('\b')  // backspace
        console.log(`${result.name}@${result.version}: ${result.prettySize}`)
      } catch (err) {
        console.error('' + err)
      }
    }
  }
  clearInterval(interval)
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
