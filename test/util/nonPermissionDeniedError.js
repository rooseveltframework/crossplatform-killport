const path = require('path')

async function nonPermissionDeniedError () {
  // override original process.kill
  const originalKillProcess = process.kill
  process.kill = (pid, signal) => {
    const error = new Error('Invalid signal')
    error.code = 'EINVAL'
    throw error
  }

  await require(path.join(__dirname, '../../killport.js'))

  process.kill = originalKillProcess
}
nonPermissionDeniedError()
