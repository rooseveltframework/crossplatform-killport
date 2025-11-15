const path = require('path')

async function permissionDeniedError () {
  // override original process.kill
  const originalKillProcess = process.kill
  process.kill = (pid, signal) => {
    const error = new Error('Operation not permitted')
    error.code = 'EPERM'
    throw error
  }

  await require(path.join(__dirname, '../../killport.js'))

  process.kill = originalKillProcess
}
permissionDeniedError()
