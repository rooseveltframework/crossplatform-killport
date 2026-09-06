#!/usr/bin/env node

const net = require('node:net')
const { spawnSync } = require('node:child_process')
const pkg = require('./package.json')

// parse command-line arguments
let silent = false
let portArg
for (const arg of process.argv.slice(2)) {
  if (arg === '--silent') silent = true
  else if (arg === '-v' || arg === '-version' || arg === '--version') {
    console.log(pkg.version)
    process.exit(0)
  } else if (portArg === undefined) portArg = arg
}

const port = Number(portArg)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Please provide a valid port number.')
  process.exit(1)
}

// resolves true if the port is in use on either ipv6 or ipv4
function checkPort (port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let ipv4Check

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true) // port is in use
      else reject(err)
    })

    server.on('listening', () => {
      if (ipv4Check) {
        server.close()
        resolve(false) // port is not in use
      } else {
        server.close(() => {
          ipv4Check = true
          server.listen(port, '0.0.0.0') // listen on ipv4 addresses
        })
      }
    })

    server.listen(port)
  })
}

// function to find the PIDs of the processes running on the given port
function findPidsOnPort (port) {
  const windows = process.platform === 'win32'

  // windows finds the PID with netstat, *nix systems with lsof
  const command = windows ? 'netstat' : 'lsof'
  const args = windows ? ['-ano'] : ['-i', `:${port}`]
  const result = spawnSync(command, args, { encoding: 'utf8', shell: false })

  if (result.error) {
    if (!silent) console.error(`Error finding process on port ${port}: `, result.error)
    return []
  }

  if (!result.stdout) {
    if (!silent) console.log(`No process found running on port ${port}`)
    return []
  }

  const pids = new Set()
  for (const line of result.stdout.trim().split('\n')) {
    const parts = line.trim().split(/\s+/)
    let pid
    if (windows) {
      // netstat columns are: proto, local address, foreign address, state, PID.
      // matching on the local address by port covers every address a process can
      // be listening on, e.g. 0.0.0.0, [::], or 127.0.0.1
      if (parts[3] === 'LISTENING' && parts[1].endsWith(`:${port}`)) pid = parseInt(parts[4], 10)
    } else {
      // lsof columns are: command, PID, ...; the header row parses to NaN and is skipped
      pid = parseInt(parts[1], 10)
    }
    if (pid) pids.add(pid)
  }

  return [...pids]
}

// function to kill the processes running on the given port
function killProcessOnPort (port) {
  for (const pid of findPidsOnPort(port)) {
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

// check if the port is in use and kill the process if it is
async function killport () {
  try {
    if (await checkPort(port)) {
      if (!silent) console.log(`Port ${port} is in use. Attempting to kill the process...`)
      killProcessOnPort(port)
    } else if (!silent) console.log(`Port ${port} is available.`)
  } catch (err) {
    if (!silent) console.error('Error checking port: ', err)
  }
}

killport()
