const net = require('node:net')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')

const killportPath = path.join(__dirname, '..', '..', 'killport.js')
const { version } = require('../../package.json')
const servers = []

// resolves true if the port is in use on either ipv6 or ipv4
function checkPort (port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    let ipv4Check

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true)
      else reject(err)
    })

    server.on('listening', () => {
      if (ipv4Check) {
        server.close()
        resolve(false)
      } else {
        server.close(() => {
          ipv4Check = true
          server.listen(port, '0.0.0.0')
        })
      }
    })

    server.listen(port)
  })
}

// starts one of the server fixtures, resolving once it reports whether it got the port
function startServer (fixture, port) {
  return new Promise((resolve, reject) => {
    const server = spawn(process.execPath, [path.join(__dirname, fixture), String(port)], {
      shell: false,
      stdio: 'pipe'
    })
    servers.push(server)

    server.stdout.on('data', (data) => {
      if (data.toString().includes(`listening on port ${port}`)) resolve(true)
    })
    // binding :: while 0.0.0.0 is already bound fails on most linux distros, which is
    // itself a case worth testing, so a failure to listen resolves rather than rejects
    server.stderr.on('data', () => resolve(false))
    server.once('error', reject)
  })
}

// runs killport.js, or a fixture that wraps it, and returns what it logged
function runKillport (args, { script = killportPath, env = process.env } = {}) {
  const { stdout, stderr } = spawnSync(process.execPath, [script, ...args.map(String)], {
    shell: false,
    stdio: 'pipe',
    encoding: 'utf8',
    env
  })
  return { stdout: stdout || '', stderr: stderr || '' }
}

// path to one of the fixtures in this directory
function fixture (name) {
  return path.join(__dirname, name)
}

// a copy of the environment with PATH pointed at a directory that does not exist, so
// killport cannot find lsof or netstat. an empty PATH will not do: both windows and
// *nix fall back to searching a default set of directories when PATH is unset
function envWithEmptyPath () {
  const env = { ...process.env }
  // windows spells it Path, and the casing has to match to override it
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === 'PATH') env[key] = fixture('no-such-directory')
  }
  return env
}

// shuts down every server started during a test and frees the port
function stopServers (port) {
  for (const server of servers.splice(0)) server.kill()
  runKillport([port])
}

module.exports = { checkPort, envWithEmptyPath, fixture, runKillport, startServer, stopServers, version }
