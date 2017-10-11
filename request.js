const https = require('https')
const util = require('util')
const Queue = require('p-queue')

let queue = new Queue({ concurrency: 10 })

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
