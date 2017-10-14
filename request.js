const https = require('https')
const util = require('util')
const Queue = require('p-queue')
const url = require('url')

let queue = new Queue({ concurrency: 10 })

exports.head = function headRequest (options) {
  options.method = 'HEAD'
  return queue.add(() => new Promise((resolve, reject) => {
    const req = https.request(options)
    req.end()

    req.on('response', (response) => {
      if (response.statusCode === 302 && response.headers['location']) {
        // redirect -> recurse
        let { hostname, path } = url.parse(response.headers['location'])
        console.log('following ' + response.headers['location'] + ' from ' + options.hostname + options.path)
        options.hostname = hostname
        options.path = path
        resolve(headRequest(options))
        return
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
      } else {
        resolve(response)
      }
    })
  }))
}
