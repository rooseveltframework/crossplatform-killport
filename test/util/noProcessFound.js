// makes the port lookup come back empty so killport reports that it found no process.
// the stubs below are never restored because this process exits once killport is done
const childProcess = require('node:child_process')

const originalSpawnSync = childProcess.spawnSync
childProcess.spawnSync = (command, args, options) => {
  if (command === 'lsof' || command === 'netstat') return { stdout: '' }
  return originalSpawnSync(command, args, options)
}

require('../../killport.js')
