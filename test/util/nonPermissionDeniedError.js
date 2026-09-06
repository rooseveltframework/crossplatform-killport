// makes killing the process fail for a reason other than permissions
process.kill = () => {
  const error = new Error('Invalid signal')
  error.code = 'EINVAL'
  throw error
}

require('../../killport.js')
