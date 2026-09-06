// makes the port check itself fail with an error killport cannot interpret as
// "the port is in use"
const net = require('node:net')

const originalOnce = net.Server.prototype.once
net.Server.prototype.once = function (event, listener) {
  if (event !== 'error') return originalOnce.call(this, event, listener)

  return originalOnce.call(this, event, () => {
    const error = new Error('Permission denied')
    error.code = 'EACCES'
    listener(error)
  })
}

require('../../killport.js')
