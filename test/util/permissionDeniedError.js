// makes killing the process fail the way it does without sufficient permissions
process.kill = () => {
  const error = new Error('Operation not permitted')
  error.code = 'EPERM'
  throw error
}

require('../../killport.js')
