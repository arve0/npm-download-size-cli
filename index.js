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
  if (process.argv.length < 3 || process.argv[2] === '--help') {
    console.log('Usage: download-size package-name [another-package ...]')
  } else {
    for (let i = 2; i < process.argv.length; i++) {
      try {
        let result = await request(process.argv[i])
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
    hostname: 'api.seljebu.no',
    path: '/download-size/' + pkgName,
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
