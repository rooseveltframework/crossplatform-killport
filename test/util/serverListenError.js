const net = require('net')
const path = require('path')

async function serverListenError () {
  // override original listen
  const originalOnce = net.Server.prototype.once
  net.Server.prototype.once = function (event, listener) {
    if (event === 'error') {
      const customListener = (err) => {
        const newErr = new Error('Permission denied')
        newErr.code = 'EACCES'
        err = newErr
        listener(err)
      }

      return originalOnce.call(this, event, customListener)
    }

    return originalOnce.call(this, event, listener)
  }

  await require(path.join(__dirname, '../../killport.js'))

  net.Server.prototype.once = originalOnce
}
serverListenError()
