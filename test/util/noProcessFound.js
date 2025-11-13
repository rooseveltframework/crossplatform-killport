const childProcess = require('child_process')
const path = require('path')

async function noProcessFound () {
  // override original spawnSync
  const originalSpawnSync = childProcess.spawnSync
  const customSpawnSyncHandler = (command, args, options) => {
    if (command === 'lsof' || command === 'netstat') {
      return {
        stdout: ''
      }
    }
    return originalSpawnSync(command, args, options)
  }
  Object.defineProperty(childProcess, 'spawnSync', {
    value: customSpawnSyncHandler,
    writable: true
  })

  await require(path.join(__dirname, '../../killport.js'))

  Object.defineProperty(childProcess, 'spawnSync', {
    value: originalSpawnSync,
    writable: true
  })
}
noProcessFound()
