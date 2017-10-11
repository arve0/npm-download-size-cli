const https = require('https')
const zlib = require('zlib')
const util = require('util')
const Queue = require('p-queue')

let queue = new Queue({ concurrency: 10 })

exports.get = function (options) {
  options.headers = Object.assign(options.headers || {}, {
    'Accept-Encoding': 'gzip',
    // get minimal number of fields
    // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
    Accept: 'application/vnd.npm.install-v1+json'
  })
  options.method = 'GET'

  return queue.add(() => new Promise((resolve, reject) => {
    const req = https.request(options)
    req.end()

    req.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
        response.destroy()
        return
      }

      let readable = response.pipe(zlib.createGunzip())
      let body = ''
      readable.setEncoding('utf8')
      readable.on('data', (chunk) => {
        body += chunk
      })

      readable.on('end', () => {
        let obj = JSON.parse(body)
        obj['_last-modified'] = response.headers['last-modified']
        resolve(obj)
      })
    })
  }))
}

exports.head = function headRequest (options) {
  options.method = 'HEAD'
  return queue.add(() => new Promise((resolve, reject) => {
    const req = https.request(options)
    req.end()

    req.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
      } else {
        resolve(response)
      }
    })
  }))
}
