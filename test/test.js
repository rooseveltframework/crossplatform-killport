/* eslint-env mocha */
const assert = require('assert')
const net = require('net')
const { spawn, spawnSync } = require('child_process')
const config = require('./util/mochaConfig.js')

function checkPort (port, callback) {
  const server = net.createServer()
  let ipv4Check

  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') callback(err, true) // port is in use
    else callback(err, false)
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

before((done) => {
  // make sure port 8080 is available before running tests
  checkPort(config.port, (err, isInUse) => {
    if (err || isInUse) {
      console.error(`Port ${config.port} is currently in use. Please supply a different port number by editing the ./util/mochaConfig.js file.`)
      process.exit(1)
    }
    done()
  })
})

describe('universal crossplatform-killport tests', () => {
  it('should kill process of specified port', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', `${config.port}`], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        spawnSync('node', ['killport.js', `${config.port}`], {
          shell: false,
          stdio: 'pipe'
        })

        checkPort(config.port, (err, isInUse) => {
          assert(!err && !isInUse, `Port ${config.port} is still in use`)
          done()
        })
      }
    })
  })

  it('should kill multiple processes of specified port', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', `${config.port}`], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        const ipv6ServerProcess = spawn('node', ['./test/util/createIpv6Server.js', `${config.port}`], {
          shell: false,
          stdio: 'pipe'
        })

        ipv6ServerProcess.stdout.on('data', (data) => {
          if (data.toString().includes(`IPv6 server is listening on port ${config.port}`)) {
            spawnSync('node', ['killport.js', `${config.port}`], {
              shell: false,
              stdio: 'pipe'
            })

            checkPort(config.port, (err, isInUse) => {
              assert(!err && !isInUse, `Port ${config.port} is still in use`)
              done()
            })
          }
        })
      }
    })
  })

  it('should kill a specified port while "--silent" mode is enabled', (done) => {
    const ipv4ServerProcess = spawn('node', ['./test/util/createIpv4Server.js', `${config.port}`], {
      shell: false,
      stdio: 'pipe'
    })

    ipv4ServerProcess.stdout.on('data', (data) => {
      if (data.toString().includes(`IPv4 server is listening on port ${config.port}`)) {
        spawnSync('node', ['killport.js', `${config.port}`, '--silent'], {
          shell: false,
          stdio: 'pipe'
        })

        checkPort(config.port, (err, isInUse) => {
          assert(!err && !isInUse, `Port ${config.port} is still in use`)
          done()
        })
      }
    })
  })

  it('should log that port is not in use', (done) => {
    const output = spawnSync('node', ['killport.js', `${config.port}`], {
      shell: false,
      stdio: 'pipe'
    })

    assert(output.stdout && output.stdout.toString().includes(`Port ${config.port} is available`), `Port ${config.port} is not available`)
    done()
  })

  it('should throw error if a valid port number is not supplied', (done) => {
    const output = spawnSync('node', ['killport.js', 'not-valid-port'], {
      shell: false,
      stdio: 'pipe'
    })

    assert(output.stderr && output.stderr.toString().includes('Please provide a valid port number'), 'Valid port number was supplied')
    done()
  })
})
