#!/usr/bin/env node

const net = require('net')
const { spawnSync } = require('child_process')

// parse command-line arguments
let silent = false
for (const arg of process.argv) {
  if (arg === '--silent') {
    silent = true
    break
  }
}

const port = parseInt(process.argv[2], 10)
if (isNaN(port)) {
  console.error('Please provide a valid port number.')
  process.exit(1)
}

// function to check if a port is in use
function checkPort (port, callback) {
  const server = net.createServer()
  let ipv4Check

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') callback(null, true) // port is in use
    else callback(err)
  })

  server.on('listening', () => {
    if (ipv4Check) {
      server.close()
      callback(null, false) // port is not in use
    } else {
      server.close(() => {
        ipv4Check = true
        server.listen(port, '0.0.0.0') // listen on ipv4 addresses
      })
    }
  })

  server.listen(port)
}

// function to find the PID of the process running on the given port
function findPidOnPort (port) {
  const platform = process.platform
  let command, args

  if (platform === 'win32') {
    // windows command to find the PID
    command = 'netstat'
    args = ['-ano']
  } else {
    // *nix command to find the PID
    command = 'lsof'
    args = ['-i', `:${port}`]
  }

  const result = spawnSync(command, args, { encoding: 'utf8', shell: false })

  if (result.error) {
    if (!silent) console.error(`Error finding process on port ${port}: `, result.error)
    return null
  }

  if (!result.stdout) {
    if (!silent) console.log(`No process found running on port ${port}`)
    return null
  }

  const pids = []
  const lines = result.stdout.trim().split('\n')
  for (const line of lines) {
    let pid
    const parts = line.trim().split(/\s+/)
    if (platform === 'win32') {
      // extract PID on windows
      if (parts[1] === `0.0.0.0:${port}` && parts[3] === 'LISTENING') pid = parseInt(parts[4])
    } else {
      // extract PID on *nix systems
      pid = parseInt(parts[1])
    }
    if (pid) pids.push(pid)
  }

  return pids
}

// function to kill the process running on the given port
function killProcessOnPort (port) {
  const pids = findPidOnPort(port)
  if (pids) {
    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGKILL')
        if (!silent) console.log(`Killed process ${pid} running on port ${port}`)
      } catch (err) {
        if (!silent) {
          const error = err.code === 'EPERM' ? 'Permission denied' : err
          console.error(`Error killing process ${pid}:`, error)
        }
      }
    }
  }
}

// check if the port is in use and kill the process if it is
checkPort(port, (err, isInUse) => {
  if (err && !silent) console.error('Error checking port: ', err)
  else if (isInUse) {
    if (!silent) console.log(`Port ${port} is in use. Attempting to kill the process...`)
    killProcessOnPort(port)
  } else if (!silent) console.log(`Port ${port} is available.`)
})
